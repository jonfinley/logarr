<?php

$str = file_get_contents(__DIR__ . "/../../../config/config.json");

$json = json_decode( $str, true);
$json['logs'] = $_POST['data'];
file_put_contents(__DIR__ . "/../../../config/config.json", json_encode($json, JSON_PRETTY_PRINT));
