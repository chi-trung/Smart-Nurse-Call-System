const int numRooms = 4;
const int btnNormal[] = {2, 4, 6, 11};
const int btnEmergency[] = {3, 5, 7, 12};
const int ledNormal[] = {A0, A2, A4, 8};
const int ledEmergency[] = {A1, A3, A5, 9};
const int buzzerPin = 10;
bool prevNormalState[numRooms];
bool prevEmergencyState[numRooms];

void setup() {
  Serial.begin(9600);
  pinMode(buzzerPin, OUTPUT);
  for (int i = 0; i < numRooms; i++) {
    pinMode(btnNormal[i], INPUT_PULLUP);
    pinMode(btnEmergency[i], INPUT_PULLUP);
    pinMode(ledNormal[i], OUTPUT);
    pinMode(ledEmergency[i], OUTPUT);
    prevNormalState[i] = HIGH;
    prevEmergencyState[i] = HIGH;
  }
  
  // Dòng này để test: Nếu LED tự tắt mà dòng này hiện lên C# -> Arduino bị reset
  Serial.println("SYSTEM_START: READY"); 
}

void loop() {
  // 1. Quét trạng thái nút nhấn
  for (int i = 0; i < numRooms; i++) {
    bool normalState = digitalRead(btnNormal[i]);
    bool emergencyState = digitalRead(btnEmergency[i]);

    // Chi xu ly mot lan khi vua nhan nut (HIGH -> LOW).
    if (prevNormalState[i] == HIGH && normalState == LOW) {
      digitalWrite(ledNormal[i], HIGH);
      Serial.print("REQ:");
      Serial.print(i + 1);
      Serial.println(":N");
      delay(80);
    }

    if (prevEmergencyState[i] == HIGH && emergencyState == LOW) {
      digitalWrite(ledEmergency[i], HIGH);
      Serial.print("REQ:");
      Serial.print(i + 1);
      Serial.println(":E");
      delay(80);
    }

    prevNormalState[i] = normalState;
    prevEmergencyState[i] = emergencyState;
  }

  // 2. Nhận lệnh bằng C-string (Mượt mà, không tốn RAM, chống Crash)
  if (Serial.available() > 0) {
    char buffer[32]; // Tạo một vùng nhớ nhỏ 32 byte để chứa lệnh
    
    // Đọc lệnh cho tới khi gặp dấu enter (\n)
    int len = Serial.readBytesUntil('\n', buffer, 31);
    buffer[len] = '\0'; // Chốt lại chuỗi

    // Cắt bỏ ký tự thừa \r do C# đẩy xuống
    if (len > 0 && buffer[len - 1] == '\r') {
      buffer[len - 1] = '\0';
    }

    // Kiểm tra và xử lý lệnh (Ví dụ: DONE:1:N)
    if (strncmp(buffer, "DONE:", 5) == 0) {
      int roomId = buffer[5] - '0' - 1; // Ký tự '1' trừ đi '0' sẽ ra số 1. Trừ tiếp 1 ra index 0.
      char type = buffer[7];            // Lấy thẳng ký tự 'N' hoặc 'E'

      if (roomId >= 0 && roomId < numRooms) {
        // Chi tat LED dung theo loai DONE duoc gui tu C#.
        if (type == 'N') {
          digitalWrite(ledNormal[roomId], LOW);
        } 
        else if (type == 'E') {
          digitalWrite(ledEmergency[roomId], LOW);
        }
      }
    } 
    else if (strcmp(buffer, "ALARM:ON") == 0) {
      digitalWrite(buzzerPin, HIGH);
    } 
    else if (strcmp(buffer, "ALARM:OFF") == 0) {
      digitalWrite(buzzerPin, LOW);
    }
  }
}