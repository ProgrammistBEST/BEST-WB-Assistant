<?php
// Конфигурация базы данных
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "honestsigndb";

// Создание соединения
$conn = new mysqli($servername, $username, $password, $dbname);

// Проверка соединения
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Получение данных из запроса
$json = file_get_contents('upload.php');
$data = json_decode($json, true);

if (!empty($data)) {
    // Пример вставки данных, в зависимости от структуры вашего JSON и таблицы
    foreach ($data as $item) {
        $column1 = $conn->real_escape_string($item['column1']);
        $column2 = $conn->real_escape_string($item['column2']);
        $column3 = $conn->real_escape_string($item['column3']);
        $column4 = $conn->real_escape_string($item['column4']);
        $column5 = $conn->real_escape_string($item['column5']);
        $column6 = $conn->real_escape_string($item['column6']);

        $column7 = $conn->real_escape_string($item['column7']);
        $column8 = $conn->real_escape_string($item['column8']);
        $column9 = $conn->real_escape_string($item['column9']);
        $column10 = $conn->real_escape_string($item['column10']);
        $column11 = $conn->real_escape_string($item['column11']);
        $column12 = $conn->real_escape_string($item['column12']);
        $column13 = $conn->real_escape_string($item['column13']);
        $column14 = $conn->real_escape_string($item['column14']);
        $column15 = $conn->real_escape_string($item['column15']);
        $column16 = $conn->real_escape_string($item['column16']);

        $sql = "INSERT INTO items (column1, column2,column3, column4,column5, column6,column7, column8,
        column9, column10,column11, column12,column13, column14,column15, column16) VALUES ('$column1', '$column2','$column3', '$column4','$column5', '$column6','$column7', '$column8','$column9', '$column10','$column11', '$column12','$column13', '$column14','$column15', '$column16')";

        if ($conn->query($sql) === TRUE) {
            $response = array("status" => "success", "message" => "Data inserted successfully");
        } else {
            $response = array("status" => "error", "message" => "Error: " . $sql . "<br>" . $conn->error);
        }
    }
} else {
    $response = array("status" => "error", "message" => "No data received");
}

$conn->close();
// header('Content-Type: application/json');
// echo json_encode($response);
?>