class INFORMATION_SERVER{
    constructor(){
        // this.connect_SKYWAY().then(()=>{

        // });
        this.start();
    }
    // async connect_SKYWAY(){
    //     //トークン生成
    //     this.token = new SKYWAY.SkyWayAuthToken({
    //         jti: SKYWAY.uuidV4(),
    //         iat: SKYWAY.nowInSec(),
    //         exp: SKYWAY.nowInSec() + 60 * 60 * 24,//一日後まで
    //         scope: {
    //             app: {
    //                 id: "bd5df00f-58bc-4a75-9e89-e4d30443927d",
    //                 turn: true,
    //                 actions: ["read"],
    //                 channels: [
    //                     {
    //                         id: "*",
    //                         name: "*",
    //                         actions: ["write"],
    //                         members: [
    //                             {
    //                                 id: "*",
    //                                 name: "*",
    //                                 actions: ["write"],
    //                                 publication: {
    //                                 actions: ["write"],
    //                                 },
    //                                 subscription: {
    //                                 actions: ["write"],
    //                                 },
    //                             },
    //                         ],
    //                         sfuBots: [
    //                             {
    //                                 actions: ["write"],
    //                                 forwardings: [
    //                                     {
    //                                     actions: ["write"],
    //                                     },
    //                                 ],
    //                             },
    //                         ],
    //                     },
    //                 ],
    //             },
    //         },
    //     }).encode("zhv5WpMMFczOCsbHgRZClb/aSX4V+VEGlwEtVwTrR5c=");
    
    //     //コンテキスト生成
    //     this.context = await SKYWAY.SkyWayContext.Create(this.token);
    //     console.log("correct context");
    
    //     //ルームの作成・取得
    //     this.room = await SKYWAY.SkyWayRoom.FindOrCreate(this.context, {
    //         type: 'p2p',
    //         name: 'SIGNAL_ROOM',
    //     });
    //     console.log("correct room");

    //     this.me = await this.room.join({
    //         name: SKYWAY.uuidV4(),
    //         metadata: JSON.stringify({
    //             type:"SERVER"
    //         })
    //     });
    //     console.log(`correct join ,id=${this.me.id}`);
    //     $("#peer_id").text(this.me.id);

    //     //data stream の生成
    //     this.local_data_stream = await SKYWAY.SkyWayStreamFactory.createDataStream();

    //     //data stream のpublish
    //     this.publication = await this.me.publish(this.local_data_stream);
    //     this.publication.onConnectionStateChanged.add(({remoteMember,state})=>{
    //         if(state == "disconnected"){
    //             //$(`#user_${remoteMember.id}`).remove();
    //             $(`#send-state_${remoteMember.id}`).text("disconnected");
    //             $(`#send-state_${remoteMember.id}`).addClass("full");
    //         }else{
    //             $(`#send-state_${remoteMember.id}`).text(state);
    //         }
    //     });
    //     //room内のpublicationを取得、subscribe
    //     this.subscriptions = {};
    //     this.room.publications.forEach((publication)=>{
    //         this.add_connecting_users(publication);
    //     });
    //     this.room.onStreamPublished.add(({publication}) => {
    //         this.add_connecting_users(publication);
    //     });
    //     //ステージ状態ロード
    //     this.reload();

    //     return;
    // }

    // async add_connecting_users(publication){
    //     if(publication.publisher.id != this.me.id){
    //         let metadata = JSON.parse(publication.publisher.metadata);

    //         let { subscription , stream } = await this.me.subscribe(publication.id);
    //         this.subscriptions[publication.publisher.id] = {
    //             subscription: subscription,
    //             stream: stream
    //         };
    //         stream.onData.add((data)=>{
    //             console.log(publication.publisher.name,metadata,data);
    //             if(data.type == "MOVE"){
    //                 if(data.stage_id > 0){
    //                     $(`#s${data.stage_id}`).text("使用中");
    //                     $(`#u${data.stage_id}`).text(metadata.UUID);
    //                     $(`#t${data.stage_id}`).text(0);
    //                     $(`#s${data.stage_id}`).removeClass("empty");
    //                     $(`#s${data.stage_id}`).addClass("full");
    //                 }
    //                 if(data.stage_id > 1){
    //                     $(`#s${data.stage_id - 1}`).text("空室");
    //                     $(`#u${data.stage_id - 1}`).text("-");
    //                     $(`#t${data.stage_id - 1}`).text("-");
    //                     $(`#s${data.stage_id - 1}`).removeClass("full");
    //                     $(`#s${data.stage_id - 1}`).addClass("empty");
    //                 }
    //             }else if(data.type == "FORCE-RELOAD"){
    //                 this.reload();
    //             }

    //         });
    //         let rec_state = await subscription.getConnectionState();
    //         let send_state = await this.publication.getConnectionState(publication.publisher);
    //         subscription.onConnectionStateChanged.add((state)=>{
    //             if(state == "disconnected"){
    //                 //$(`#user_${publication.publisher.id}`).remove();
    //                 $(`#rec-state_${publication.publisher.id}`).text("disconnected");
    //                 $(`#rec-state_${publication.publisher.id}`).addClass("full");
    //             }else{
    //                 $(`#rec-state_${publication.publisher.id}`).text(state);
    //             }
                
    //         });
    //         $("#connecting_users").append(`<tr id="user_${publication.publisher.id}">
    //             <td>${metadata.UUID}</td>
    //             <td>${publication.publisher.id}</td>
    //             <td id="send-state_${publication.publisher.id}">${send_state}</td>
    //             <td id="rec-state_${publication.publisher.id}">${rec_state}</td>
    //         </tr>`);
    //     }
    // }
    async start(){
        this.STAGES = ["entrance", "laser", "mystery_1", "box", "mystery_2", "trump", "mystery_last", "CLEAR", ];
        this.used_rooms = [false,false,false,false,false,false];
        this.stage_states = null;

        //ステージ状態ロード
        this.reload();
        //トリガー
        $("#reload-trg").on("click",this.reload.bind(this));
        //参加・移動
        $("#add-trg").on("click", () => {
			$("#adder").show();
		});
		$("#adder #allow").on("click", async() => {
			let trg_uuid = `${$("#uuid-enter-1").val()}-${$("#uuid-enter-2").val()}-${$("#uuid-enter-3").val()}-${$("#uuid-enter-4").val()}-${$("#uuid-enter-5").val()}`;
			if(trg_uuid.length == 36) {
                $("#adder #allow").attr("disabled", true);
                $("#adder #reject").attr("disabled", true);
				try {
					let response = await fetch(`https://script.google.com/macros/s/AKfycbwMbUDB-Gdqrm9grC9nx9evBZG59NTOiT58YueT1LVB_BEOwaBun6DvarLmwlKPtoec/exec?type=kick&trg_uuid=${trg_uuid}`, {
                        method: "GET",
                        cache: "no-cache",
                    });
                    if(await response.text() == "success"){
                        let data = [{
                            name: $("#adder #room-selector").val(),
                            state: [
                                Math.floor(Date.now()/1000),
                                trg_uuid,
                                true
                            ]
                        }];
                        data = encodeURI(JSON.stringify(data));
                        let response = await fetch(`https://script.google.com/macros/s/AKfycbwMbUDB-Gdqrm9grC9nx9evBZG59NTOiT58YueT1LVB_BEOwaBun6DvarLmwlKPtoec/exec?type=write&data=${data}`, {
                            method: "GET",
                            cache: "no-cache",
                        });
                        if(await response.text() == "success"){
                            alert("完了しました。");
                            this.reload();
                            $("#adder").hide();
                        }else{
                            alert("サーバー側でエラーが発生しました。");
                        }
                    }else{
                        alert("サーバー側でエラーが発生しました。");
                    }
				} catch(e) {
					alert(e.message);
				}
                $("#adder #allow").attr("disabled", false);
                $("#adder #reject").attr("disabled", false);
			} else {
				alert("文字数が異なります。")
			}
		});
		$("#adder #reject").on("click", () => {
			$("#adder").hide()
		})
        //追放
        $("#kick-trg").on("click", () => {
			$("#kicker").show();
		});
		$("#kicker #allow").on("click", async() => {
            $("#kicker #allow").attr("disabled", true);
            $("#kicker #reject").attr("disabled", true);
            try {
                let room_name = $("#kicker #room-selector").val();
                if(this.stage_states[room_name].is_used){
                    let response = await fetch(`https://script.google.com/macros/s/AKfycbwMbUDB-Gdqrm9grC9nx9evBZG59NTOiT58YueT1LVB_BEOwaBun6DvarLmwlKPtoec/exec?type=kick&trg_uuid=${this.stage_states[room_name].uuid}`, {
                        method: "GET",
                        cache: "no-cache",
                    });
                    if(await response.text() == "success"){
                        alert("完了しました。");
                        this.reload();
                        $("#kicker").hide();
                    }else{
                        alert("サーバー側でエラーが発生しました。");
                    }
                }else{
                    alert("選択されたルームにはユーザーがいません。");
                }
            } catch(e) {
                alert(e.message);
            }
            $("#kicker #allow").attr("disabled", false);
            $("#kicker #reject").attr("disabled", false);
		});
		$("#kicker #reject").on("click", () => {
			$("#kicker").hide();
		})
        
        //経過時間を計算
        this.time_reload_interval = setInterval(this.reload_time.bind(this),1000);
    }

    async reload(){
        //取得中にする
        this.used_rooms = [false,false,false,false,false,false];
        for(let i = 0;i<6;i++){
            $(`#s${i+1}`).text("取得中");
            $(`#u${i+1}`).text("-");
            $(`#t${i+1}`).text("-");
            $(`#s${i+1}`).removeClass("empty");
            $(`#s${i+1}`).removeClass("full");
            $(`#s${i+1}`).addClass("wait");
        }
        //ステージ状態ロード
        let response = await fetch(
            `https://script.google.com/macros/s/AKfycbwMbUDB-Gdqrm9grC9nx9evBZG59NTOiT58YueT1LVB_BEOwaBun6DvarLmwlKPtoec/exec?type=state`,{
                method:"GET",
                cache: "no-cache",
            }
        );
        this.stage_states = await response.json();
        for(let [i,state] of Object.entries(Object.values(this.stage_states))){
            if(state.is_used){
                $(`#s${Number(i)+1}`).text("使用中");
                $(`#u${Number(i)+1}`).text(state.uuid);
                this.used_rooms[i] = true;
                $(`#t${Number(i)+1}`).text("--:--");
                $(`#s${Number(i)+1}`).removeClass("wait");
                $(`#s${Number(i)+1}`).addClass("full");
            }else{           
                $(`#s${Number(i)+1}`).text("空室");
                $(`#u${Number(i)+1}`).text("-");
                this.used_rooms[i] = false;
                $(`#t${Number(i)+1}`).text("-");
                $(`#s${Number(i)+1}`).removeClass("wait");
                $(`#s${Number(i)+1}`).addClass("empty");
            }
        }

        $("#reload-time").text((new Date()).toLocaleString());
    }

    reload_time(){
        for(let i = 0;i<6;i++){
            if(this.used_rooms[i]){//ルームが使用されていたら
                let elapsed_time = new Date(Date.now() - this.stage_states[this.STAGES[i+1]].enter_T*1000);
                $(`#t${i+1}`).text(elapsed_time.toUTCString().slice(20,25));
            }
        }
    }
}

window.onload = ()=>{
    // window.SKYWAY = skyway_room;
    window.SERVER_INSTANCE = new INFORMATION_SERVER();
}