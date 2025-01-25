<?php
// // Конфигурация базы данных
// $servername = "localhost";
// $username = "root";
// $password = "";
// $dbname = "honestsigndb";

// // Создание подключения
// $conn = new mysqli($servername, $username, $password, $dbname);

// // Проверка подключения
// if ($conn->connect_error) {
//     die("Connection failed: " . $conn->connect_error);
// }

// // Чтение JSON данных из файла
// $json = file_get_contents('data.json');
// $data = json_decode($json, true);

// foreach ($data as $product) {
//     // Вставка данных в таблицу products
//     $stmt = $conn->prepare("INSERT INTO products (nmID, vendorCode) VALUES (?, ?)");
//     $stmt->bind_param("is", $product['nmID'], $product['vendorCode']);
//     $stmt->execute();
//     $product_id = $stmt->insert_id;
//     $stmt->close();
    
//     // Вставка данных в таблицу characteristics
//     foreach ($product['characteristics'] as $characteristic) {
//         $value = is_array($characteristic['value']) ? implode(", ", $characteristic['value']) : $characteristic['value'];
//         $stmt = $conn->prepare("INSERT INTO characteristics (product_id, characteristic_id, name, value) VALUES (?, ?, ?, ?)");
//         $stmt->bind_param("iiss", $product_id, $characteristic['id'], $characteristic['name'], $value);
//         $stmt->execute();
//         $stmt->close();
//     }

//     // Вставка данных в таблицу sizes
//     foreach ($product['sizes'] as $size) {
//         $skus = is_array($size['skus']) ? implode(", ", $size['skus']) : $size['skus'];
//         $stmt = $conn->prepare("INSERT INTO sizes (product_id, chrtID, techSize, wbSize, skus) VALUES (?, ?, ?, ?, ?)");
//         $stmt->bind_param("iisss", $product_id, $size['chrtID'], $size['techSize'], $size['wbSize'], $skus);
//         $stmt->execute();
//         $stmt->close();
//     }
// }

// echo "Data inserted successfully";

// $conn->close();
?>