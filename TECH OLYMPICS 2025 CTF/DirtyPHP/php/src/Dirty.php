<?php

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    highlight_file(__FILE__);
    exit;
}
$filename=$_POST['filename'];
$data=$_POST['data'];
$file_name=$_POST['file_name'];
$useless="<?php echo 'hdllo'; exit(); ?>";
$data=substr($data,0,220);
$filename=substr($filename,0,120);
$file_name=substr($file_name,0,11);
$asis=str_repeat("techolympics", 45);
$rand=bin2hex(random_bytes(55));
$tmp=$rand.'.txt';
@file_put_contents($filename,$useless.$data);
$size=intdiv(filesize($file_name),100);
if ($size>10) die('hdd is full');
$content=@file_get_contents($file_name);
@unlink($file_name);
$a = array(1 => 'techolympics',2 => 'techOlympics',3 => '1337',4 => 'TechOlympics',5 => 'Techolympics',6 => 'techolympicS',7 => 'TecholympicS',8 => $rand ,55 => "techolympics");
$b =& $a[$size];
$c = $a;
$c[8] = $asis; 
if (strpos($content, $a[8])!==false)
{
	$php=str_replace($a[8],'',$content);
	file_put_contents($tmp,"<?php ".$php."?> \r\n \r\n*/ \r\n \r\n <?php comment Me echo echo echo ... ");
	@include($tmp);
	//@unlink($tmp);			
}
