// Importer les modules nécessaires
const express = require('express');
const mqtt = require('mqtt');
const path = require('path');

// Initialiser l'application Express
const app = express();
const port = 3000;
const host = 'localhost';

// Configurer le broker MQTT
const options = {
  host: 'env-6680648.rag-cloud.hosteur.com',  // Remplacez par l'adresse de votre broker
  port: 1883,                // Port par défaut pour MQTT non sécurisé
  username: 'iot_magic',  // Remplacez par votre username
  password: 'lRJVjo8DjGjP4zO',  // Remplacez par votre password
};

const mqttClient = mqtt.connect(options);

// Sujet MQTT pour la publication et l'abonnement
const subscribeTopic = 'bin/state/';
const publishTopic = 'bin/action/';

// Variables pour stocker le message reçu
let receivedMessage = '';

let messages = {
    limit: null,
    current: null,
};

// Configuration de l'application pour servir des fichiers statiques et parser les requêtes POST
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Route pour afficher la page web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour récupérer les messages MQTT actuels
app.get('/api/messages', (req, res) => {
    res.json(messages);
});

// Route pour publier des messages MQTT depuis le formulaire de la page web
app.post('/reset', (req, res) => {
    const message = req.body.message;
    const mqttMEssage = {
        cmd: "reset",
        value : null
        };
    const jsonString = JSON.stringify(mqttMEssage);
    mqttClient.publish(publishTopic, jsonString, () => {
        console.log(`Message publié sur ${publishTopic}: ${jsonString}`);
    });
    res.redirect('/');
});

app.post('/publish_limit', (req, res) => {
    const message = req.body.message;
    const mqttMEssage = {
        cmd: "set_capacity",
        value : message
    };
    const jsonString = JSON.stringify(mqttMEssage);
    mqttClient.publish(publishTopic, jsonString, () => {
      console.log(`Message publié sur ${publishTopic}: ${jsonString}`);
    });
    res.redirect('/');
  });

// Se connecter au broker MQTT
mqttClient.on('connect', () => {
  console.log('Connecté au broker MQTT');
  mqttClient.subscribe(subscribeTopic, (err) => {
    if (err) {
      console.error(`Erreur lors de l'abonnement au sujet ${subscribeTopic}:`, err);
    } else {
      console.log(`Abonné au sujet ${subscribeTopic}`);
    }
  });
});

// Gestion des messages reçus
mqttClient.on('message', (topic, message) => {
    console.log(`Message reçu sur le topic ${topic}: ${message.toString()}`);
    // Essayer de parser le message en JSON
    try {
        const jsonMessage = JSON.parse(message.toString());
        // Mettre à jour le message reçu dans la variable
        if (topic === subscribeTopic) {
            messages.current = jsonMessage.current;
            messages.limit = jsonMessage.limit;
        }
        console.log(`messages : ${messages.current} ${messages.limit}`);
    } catch (error) {
        console.error(`Erreur de parsing JSON pour le topic ${topic}:`, error);
    }
});

// Démarrer le serveur
app.listen(port, host, () => {
    console.log(`Serveur en cours d'exécution sur http://${host}:${port}`);
});