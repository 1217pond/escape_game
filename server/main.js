class INFORMATION_SERVER{
    constructor(){
        this.connect_SKYWAY().then(()=>{
            this.room_is_empty = [null,true,true,true,true,true,true];//入口は無効
        });
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
        this.me = await this.room.join({
            name: "SERVER"
        });
        console.log(`correct join ,id=${this.me.id}`);
        $("#peer_id").text(this.me.id);

        //data stream の生成
        this.local_data_stream = await SKYWAY.SkyWayStreamFactory.createDataStream();

        //data stream のpublish
        this.publication = await this.me.publish(this.local_data_stream);
        this.publication.onConnectionStateChanged.add(({remoteMember,state})=>{
            if(state == "disconnected"){
                $(`#user_${remoteMember.id}`).remove();
            }else{
                $(`#send-state_${remoteMember.id}`).text(state);
            }
        });
        //room内のpublicationを取得、subscribe
        this.subscriptions = {};
        this.room.publications.forEach((publication)=>{
            this.add_connecting_users(publication);
        });
        this.room.onStreamPublished.add(({publication}) => {
            this.add_connecting_users(publication);
        });

        return;
    }

    async add_connecting_users(publication){
        if(publication.publisher.id != this.me.id){
            let { subscription , stream } = await this.me.subscribe(publication.id);
            this.subscriptions[publication.publisher.id] = {
                subscription: subscription,
                stream: stream
            };
            stream.onData.add((data)=>{
                console.log(publication.publisher.name,data);
                if(data.type == "MOVE"){
                    
                    if(data.stage_id > 0){
                        $(`#s${data.stage_id}`).text("使用中");
                        $(`#u${data.stage_id}`).text(publication.publisher.name);
                        $(`#s${data.stage_id}`).removeClass("empty");
                        $(`#s${data.stage_id}`).addClass("full");

                        this.room_is_empty[data.stage_id] = false;
                    }
                    if(data.stage_id > 1){
                        $(`#s${data.stage_id - 1}`).text("空室");
                        $(`#u${data.stage_id - 1}`).text("-");
                        $(`#s${data.stage_id - 1}`).removeClass("full");
                        $(`#s${data.stage_id - 1}`).addClass("empty");
                        this.room_is_empty[data.stage_id - 1] = true;
                    }
                    if(data.stage_id == 6){
                        this.local_data_stream.write({
                            type:"CONDITION",
                            time:-1,
                            stage_id:data.stage_id,
                            condition:"last",
                            address:publication.publisher.name,
                        });
                    }else{
                        this.local_data_stream.write({
                            type:"CONDITION",
                            time:-1,
                            stage_id:data.stage_id,
                            condition:this.room_is_empty[data.stage_id + 1] ? "empty" : "full",
                            address:publication.publisher.name,
                        });
                    }
                }else if(data.type == "ESCAPE"){
                    $(`#s6`).text("空室");
                    $(`#u6`).text("-");
                    $(`#s6`).removeClass("full");
                    $(`#s6`).addClass("empty");
                    this.room_is_empty[6] = true;
                    this.local_data_stream.write({
                        type:"CONDITION",
                        time:-1,
                        stage_id:7,
                        condition:"last",
                        address:publication.publisher.name,
                    });
                }
            });
            let rec_state = await subscription.getConnectionState();
            let send_state = await this.publication.getConnectionState(publication.publisher);
            subscription.onConnectionStateChanged.add((state)=>{
                if(state == "disconnected"){
                    $(`#user_${publication.publisher.id}`).remove();
                }else{
                    $(`#rec-state_${publication.publisher.id}`).text(state);
                }
                
            });
            $("#connecting_users").append(`<tr id="user_${publication.publisher.id}">
                <td>${publication.publisher.name}</td>
                <td>${publication.publisher.id}</td>
                <td id="send-state_${publication.publisher.id}">${send_state}</td>
                <td id="rec-state_${publication.publisher.id}">${rec_state}</td>
            </tr>`);
        }
    }
}

window.onload = ()=>{
    window.SKYWAY = skyway_room;
    window.SERVER_INSTANCE = new INFORMATION_SERVER();
}