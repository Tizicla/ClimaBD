#include <SimpleDHT.h>
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// Credenciales WiFi
#define WIFI_SSID "Alumnos"
#define WIFI_PASSWORD "@@1umN05@@"

// Firebase API y autenticación
#define API_KEY "AIzaSyBFIhz4mRKibRgzy4Om4W20liXeCUt-r74"
#define DATABASE_URL "sensorth-c671d-default-rtdb.firebaseio.com"
#define USER_EMAIL "feliperangel@gmail.com"
#define USER_PASSWORD "747317Frm"

// Definiciones del sensor y LED
int pinDHT11 = D2;
int LED = D4;
SimpleDHT11 dht11(pinDHT11);

// Objetos Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Variables para control de tiempo y contador
unsigned long sendDataPrevMillis = 0;
unsigned long count = 0;
bool taskCompleted = false;

void setup() {
  Serial.begin(115200);
  
  pinMode(LED, OUTPUT);
  
  // Conectar a WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando a WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Conectado con IP: ");
  Serial.println(WiFi.localIP());

  // Configurar Firebase
  config.api_key = API_KEY;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  config.database_url = DATABASE_URL;
  
  // No es necesario redefinir la función tokenStatusCallback, ya está en TokenHelper.h
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectNetwork(true);

  fbdo.setBSSLBufferSize(4096, 1024);  // Ajuste de buffer SSL
}

void loop() {
  // Leer temperatura y humedad del sensor DHT11
  byte temperature = 0;
  byte humidity = 0;
  int err = dht11.read(&temperature, &humidity, NULL);
  
  if (err != SimpleDHTErrSuccess) {
    Serial.print("Error leyendo DHT11: ");
    Serial.println(err);
    delay(1000);
    return;
  }

  // Mostrar los valores leídos
  Serial.print("Temperatura: ");
  Serial.print((int)temperature);
  Serial.println(" °C");
  
  Serial.print("Humedad: ");
  Serial.print((int)humidity);
  Serial.println(" %");

  // Encender o apagar el LED según la humedad
  if ((int)humidity > 50) {
    digitalWrite(LED, LOW); // LOW enciende el LED
  } else {
    digitalWrite(LED, HIGH); // HIGH apaga el LED
  }

  // Enviar datos a Firebase cada 15 segundos
  if (Firebase.ready() && (millis() - sendDataPrevMillis > 15000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();

    // Crear el objeto JSON con los datos actuales
    FirebaseJson json;
    json.set("temperatura", (int)temperature);
    json.set("humedad", (int)humidity);

    // Obtener el timestamp del servidor
    if (Firebase.setTimestamp(fbdo, "/sensor/tiempo_real")) {
      // Guardar el timestamp en el JSON
      json.set("timestamp", fbdo.to<uint64_t>());
    } else {
      Serial.print("Error obteniendo timestamp: ");
      Serial.println(fbdo.errorReason());
    }
    
    // Enviar los datos en tiempo real
    if (Firebase.set(fbdo, F("/sensor/"), json)) {
      Serial.println("Datos enviados en tiempo real.");
    } else {
      Serial.print("Error al enviar datos en tiempo real: ");
      Serial.println(fbdo.errorReason());
    }

    // Guardar el historial de datos
    String pathHistorial = "/sensorHist/historico/" + String(count);
    if (Firebase.set(fbdo, pathHistorial, json)) {
      Serial.println("Datos históricos guardados.");
      count++;
    } else {
      Serial.print("Error al guardar datos históricos: ");
      Serial.println(fbdo.errorReason());
    }
  }

  delay(5000); // Espera de 5 segundos entre lecturas
}
