// Importer les modules nécessaires
const express = require('express');
const mqtt = require('mqtt');
const path = require('path');

// Initialiser l'application Express
const app = express();
const port = 3123;
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
const subscribeTopicBin1 = 'bin/state/magic_bin_1';
const publishTopicBin1 = 'bin/action/magic_bin_1';

const subscribeTopicBin2 = 'bin/state/magic_bin_2';
const publishTopicBin2 = 'bin/action/magic_bin_2';

// Variables pour stocker le message reçu
let messages = {
  bin1: {
    limit: null,
    current: null
  },
  bin2: {
    limit: null,
    current: null
  }
};

// Configuration de l'application pour servir des fichiers statiques et parser les requêtes POST
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Route pour afficher la page web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour récupérer les messages MQTT actuels
app.get('/api/messages/bin1', (req, res) => {
    res.json(messages.bin1);
});

app.get('/api/messages/bin2', (req, res) => {
  res.json(messages.bin2);
});

// Route pour publier des messages MQTT depuis le formulaire de la page web
app.post('/reset/bin1', (req, res) => {
  const mqttMessage = {
    cmd: "reset",
    value : null
  };
  const jsonString = JSON.stringify(mqttMessage);
  mqttClient.publish(publishTopicBin1, jsonString, () => {
    console.log(`Message publié sur ${publishTopicBin1}: ${jsonString}`);
  });
  res.redirect('/');
});

app.post('/reset/bin2', (req, res) => {
  const mqttMessage = {
    cmd: "reset",
    value : null
  };
  const jsonString = JSON.stringify(mqttMessage);
  mqttClient.publish(publishTopicBin2, jsonString, () => {
    console.log(`Message publié sur ${publishTopicBin2}: ${jsonString}`);
  });
  res.redirect('/');
});

app.post('/publish_limit/bin1', (req, res) => {
  const message = req.body.message;
  const mqttMessage = {
    cmd: "set_capacity",
    value : message
  };
  const jsonString = JSON.stringify(mqttMessage);
  mqttClient.publish(publishTopicBin1, jsonString, () => {
    console.log(`Message publié sur ${publishTopicBin1}: ${jsonString}`);
  });
  res.redirect('/');
});

app.post('/publish_limit/bin2', (req, res) => {
  const message = req.body.message;
  const mqttMessage = {
    cmd: "set_capacity",
    value : message
  };
  const jsonString = JSON.stringify(mqttMessage);
  mqttClient.publish(publishTopicBin2, jsonString, () => {
    console.log(`Message publié sur ${publishTopicBin2}: ${jsonString}`);
  });
  res.redirect('/');
});

// Se connecter au broker MQTT
mqttClient.on('connect', () => {
  console.log('Connecté au broker MQTT');
  mqttClient.subscribe([subscribeTopicBin1,subscribeTopicBin2], (err) => {
    if (err) {
      console.error(`Erreur lors de l'abonnement au sujet :`, err);
    } else {
      console.log(`Abonné au sujet ${subscribeTopicBin1} et ${subscribeTopicBin2}`);
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
        if (topic === subscribeTopicBin1) {
            messages.bin1.current = jsonMessage.current;
            messages.bin1.limit = jsonMessage.limit;
            console.log(`Messages Bin 1: current=${messages.bin1.current}, limit=${messages.bin1.limit}`);
        } else if (topic === subscribeTopicBin2) {
          messages.bin2.current = jsonMessage.current;
          messages.bin2.limit = jsonMessage.limit;
          console.log(`Messages Bin 2: current=${messages.bin2.current}, limit=${messages.bin2.limit}`);
      }
    } catch (error) {
        console.error(`Erreur de parsing JSON pour le topic ${topic}:`, error);
    }
});

// Démarrer le serveur
app.listen(port, host, () => {
    console.log(`Serveur en cours d'exécution sur http://${host}:${port}`);
});