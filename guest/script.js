class GUEST_CONNECTION{
    constructor(success_callback){
        this.success_callback = success_callback;
        this.connect_SKYWAY();
    }
    async connect_SKYWAY(){
        //トークン生成
        this.token = new SKYWAY.SkyWayAuthToken({
            jti: SKYWAY.uuidV4(),
            iat: SKYWAY.nowInSec(),
            exp: SKYWAY.nowInSec() + 60 * 60 * 24,//一日後まで
            scope: {
                app: {
                    id: "bd5df00f-58bc-4a75-9e89-e4d30443927d",
                    turn: true,
                    actions: ["read"],
                    channels: [
                        {
                            id: "*",
                            name: "*",
                            actions: ["write"],
                            members: [
                                {
                                    id: "*",
                                    name: "*",
                                    actions: ["write"],
                                    publication: {
                                    actions: ["write"],
                                    },
                                    subscription: {
                                    actions: ["write"],
                                    },
                                },
                            ],
                            sfuBots: [
                                {
                                    actions: ["write"],
                                    forwardings: [
                                        {
                                        actions: ["write"],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
        }).encode("zhv5WpMMFczOCsbHgRZClb/aSX4V+VEGlwEtVwTrR5c=");
    
        //コンテキスト生成
        this.context = await SKYWAY.SkyWayContext.Create(this.token);
        console.log("correct context");
    
        //ルームの作成・取得
        this.room = await SKYWAY.SkyWayRoom.FindOrCreate(this.context, {
            type: 'p2p',
            name: 'SIGNAL_ROOM',
        });
        console.log("correct room");

        //参加
        this.UUID = SKYWAY.uuidV4();
        this.me = await this.room.join({
            name: this.UUID
        });
        console.log(`correct join ,id=${this.me.id}`);
        $("#peer_id").text(this.me.id);

        //data stream の生成
        this.local_data_stream = await SKYWAY.SkyWayStreamFactory.createDataStream();
        this.local_data_stream.onConnectionStateChanged.add(({state,remoteMember})=>{
            console.log(state);
        });

        //data stream のpublish
        this.publication = await this.me.publish(this.local_data_stream);

        //room内のpublicationを取得、subscribe
        this.room.publications.forEach(async(publication)=>{
            if(publication.publisher.name == "SERVER"){
                let { subscription , stream } = await this.me.subscribe(publication.id);
                this.server_subscription = subscription;
                //console.log(await this.server_subscription.getConnectionState());
                this.server_stream = stream;
                this.server_stream.onData.add((data) => {
                    if(data.type == "CONDITION" && data.address != this.UUID && data.stage_id == NOW_STAGE_ID + 2){
                        $("#indicator").removeClass("stage_condition_full");
                        $("#indicator").addClass("stage_condition_empty");
                        $("#indicator").text("空き");
                        if(MYSTERY_STAGES.includes(NOW_STAGE_ID)){
                            if(IS_CORRECTED){
                                $("#go_next_stage").attr("disabled",false);
                            }else{
                                $("#go_next_stage").attr("disabled",true);
                            }
                        }else{
                            $("#go_next_stage").attr("disabled",false);
                        }
                    }else if(data.type == "CONDITION" && data.address != this.UUID && data.stage_id == 1 && NOW_STAGE_ID == 0){
                        $("#indicator").removeClass("stage_condition_empty");
                        $("#indicator").addClass("stage_condition_full");
                        $("#indicator").text("使用中");
                        $("#go_next_stage").attr("disabled",true);
                    }
                });
                setTimeout(()=>{this.success_callback();},1000);
                
            }
        });
    }
    send_next_stage(stage_id){
        return new Promise((resolve) => {
            let {removeListener} = this.server_stream.onData.add((data) => {
                console.log(data);
                if(data.type == "CONDITION" && data.address == this.UUID){
                    removeListener();
                    resolve({
                        condition:data.condition,
                        time:data.time,
                    });
                }
            });
            this.local_data_stream.write({
                type:"MOVE",
                stage_id:stage_id
            });
        });
    }
}

function get_stage_condition(stage_id){
    return new Promise(async(resolve)=>{
        resolve((await CONNECTING_INSTANCE.send_next_stage(stage_id)).condition);
        //setTimeout(()=>{resolve("empty")},300);
    });
}

function show_stage_info(stage_id){
    $("#connecting").show();
    //ページ遷移
    if(stage_id > 0){
        $(STAGES_DIV_QUERY[stage_id - 1]).hide();
    }else{
        $("#loading").hide();
        $("#stage_changer").show();
    }
    $(STAGES_DIV_QUERY[stage_id]).show();
    $("#indicator").text("取得中");

    //状態を待機に
    $("#indicator").removeClass("stage_condition_empty");
    $("#indicator").removeClass("stage_condition_full");
    $("#indicator").addClass("stage_condition_wait");

    $("#go_next_stage").attr("disabled",true);
    IS_CORRECTED = false;

    switch(stage_id){
        case 0://entrance
            break;
        case 1://laser
            break;
        case 2://mystery_1
            $("#answer_area").show();
            break;
        case 3://box
            $("#answer_field").val("");
            $("#answer_area").hide();
            break;
        case 4://mystery_2
            $("#answer").attr("disabled",false);
            $("#answer_field").attr("disabled",false);
            $("#answer_area").show();
            break;
        case 5://trump
            $("#answer_field").val("");
            $("#answer_area").hide();
            break;
        case 6://mystery_last
            $("#answer").attr("disabled",false);
            $("#answer_field").attr("disabled",false);
            $("#stage_changer").hide();
            $("#escape_stage").show();
            $("#answer_area").show();
            break;
        case 7:
            $("#stage_changer").hide();
            $("#answer_area").hide();
            break;
    }

    NEXT_STAGE_CONDITION = "wait"
    get_stage_condition(stage_id).then(condition =>{
        $("#connecting").hide();
        NEXT_STAGE_CONDITION = condition;
        switch(condition){
            case "empty":
                $("#indicator").removeClass("stage_condition_wait");
                $("#indicator").addClass("stage_condition_empty");
                $("#indicator").text("空き");
                if(MYSTERY_STAGES.includes(stage_id)){
                    $("#go_next_stage").attr("disabled",true);
                }else{
                    IS_CORRECTED = true;//謎解きステージでなければ、正答状態を既にtrueにする。
                    $("#go_next_stage").attr("disabled",false);
                }
                break;
            case "full":
                $("#indicator").removeClass("stage_condition_wait");
                $("#indicator").addClass("stage_condition_full");
                $("#indicator").text("使用中");
                break;
            case "last"://最終ステージ用
                break;
            default:
                alert("エラー：予期せぬステージ状態情報");
                break;
        }
    });
}

window.onload = ()=>{
    window.SKYWAY = skyway_room;
    window.CONNECTING_INSTANCE = new GUEST_CONNECTION(()=>{
        $("#connecting").hide();
        show_stage_info(0);
    });
};

$("#answer_field").on("input",()=>{
    if($("#answer_field").val()){
        $("#answer").attr("disabled",false);
    }else{
        $("#answer").attr("disabled",true);
    }
});

$("#answer").on("click",()=>{
    if($("#answer_field").val() == MYSTERY_ANSWERS[NOW_STAGE_ID]){
        alert("正解！");
        IS_CORRECTED = true;
        if(NOW_STAGE_CONDITION == "full"){//次ルームの状態が使用中だったとき、正答してもdisabledにする。
            $("#go_next_stage").attr("disabled",true);
        }else{ 
            if(NOW_STAGE_ID != 6){
                $("#go_next_stage").attr("disabled",false);
            }else{
                $("#escape").attr("disabled",false);
            }
        }
        
        $("#answer").attr("disabled",true);
        $("#answer_field").attr("disabled",true);
    }else{
        alert("不正解...");
    }
});

$("#go_next_stage").on("click",()=>{
    NOW_STAGE_ID++;
    show_stage_info(NOW_STAGE_ID);
});

$("#escape").on("click",()=>{
    CONNECTING_INSTANCE.local_data_stream.write({
        type:"ESCAPE"
    });
    $("#answer_area").hide();
    $("#escape_stage").hide();
    $("#stage_last").hide();
    $("#stage_clear").show();
});

NEXT_STAGE_CONDITION = "wait"
NOW_STAGE_ID = 0
STAGES = [
    "entrance",
    "laser",
    "mystery_1",
    "box",
    "mystery_2",
    "trump",
    "mystery_last",
    "CLEAR",
];
STAGES_DIV_QUERY = [
    "#stage_ent",
    "#stage_A",
    "#stage_B",
    "#stage_C",
    "#stage_D",
    "#stage_E",
    "#stage_last",
    "#stage_clear"
];
MYSTERY_STAGES = [2,4,6];
MYSTERY_ANSWERS = [
    "",
    "",
    "answer",
    "",
    "answer",
    "",
    "answer",
    ""
];
IS_CORRECTED = false;
