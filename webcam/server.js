

var WebSocket = require('C:\\Program Files\\nodejs\\node_modules\\ws').Server;

var wss = new WebSocket({

  		port: 9090,

});

//conexiones al servidor
var users = {};

//cuando un usuario se conecta
wss.on('connection', function(connection) {

   console.log("usuario conectado");

   //cuando el servidor obtiene un mensaje
   connection.on('message', function(message) {

      var data;

      //acepta solo mensajes JSON
      try {
         data = JSON.parse(message);
      } catch (e) {
         console.log("JSON invalido");
         data = {};
      }

      //cambiando el tipo de mensajes del usuario
      switch (data.type) {
         //cuando un usuario trata de logearse
         case "login":
            console.log("User logged", data.name);

            //si alguien se logeo con este usuario, se rechaza.
            if(users[data.name]) {
               sendTo(connection, {
                  type: "login",
                  success: false
               });
            } else {
               //guardando la conexion de usuario en el servidor
               users[data.name] = connection;
               connection.name = data.name;

               sendTo(connection, {
                  type: "login",
                  success: true
               });
            }

            break;

         case "offer":
            //cuando el usuario A llama al B
            console.log("Enviando oferta a: ", data.name);

            //si UserB existe, se manda los detalles de la oferta
            var conn = users[data.name];

            if(conn != null) {
               //configurando que el UserA se conecta con el UserB
               connection.otherName = data.name;

               sendTo(conn, {
                  type: "offer",
                  offer: data.offer,
                  name: connection.name
               });
            }

            break;

         case "answer":
            console.log("Enviando respuesta a: ", data.name);
            //por ejemplo. UserB responde a UserA
            var conn = users[data.name];

            if(conn != null) {
               connection.otherName = data.name;
               sendTo(conn, {
                  type: "answer",
                  answer: data.answer
               });
            }

            break;

         case "candidate":
            console.log("Enviando candidato a:",data.name);
            var conn = users[data.name];

            if(conn != null) {
               sendTo(conn, {
                  type: "candidate",
                  candidate: data.candidate
               });
            }

            break;

         case "salir":
            console.log("Desconectando de", data.name);
            var conn = users[data.name];
            conn.otherName = null;

            //notify the other user so he can disconnect his peer connection
            if(conn != null) {
               sendTo(conn, {
                  type: "salir"
              });
            }

            break;

         default:
            sendTo(connection, {
               type: "error",
               message: "Comando no encontrado: " + data.type
            });

            break;
      }

   });

   //Cuando un usuario sale, cierra la ventana del navegador.
   connection.on("cerrar", function() {

      if(connection.name) {
         delete users[connection.name];

         if(connection.otherName) {
            console.log("Desconectando de ", connection.otherName);
            var conn = users[connection.otherName];
            conn.otherName = null;

            if(conn != null) {
               sendTo(conn, {
                  type: "salir"
               });
            }
         }
      }

   });

   connection.send("Hola mundo");
});

function sendTo(connection, message) {
   connection.send(JSON.stringify(message));
}
