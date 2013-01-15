<?php

$file = 'files/fsb-galery-1.0.0.zip';
$filesize = filesize($file);
$filename = 'fsb-galery-1.0.0.zip';

header('Pragma: public');
header('Expires: 0'); 
header('Cache-Control: must-revalidate, post-check=0, pre-check=0'); 
header('Content-Description: File Transfer');
header('Content-Type: application/force-download');
header('Content-Transfer-Encoding: binary;');
header('Content-Disposition: attachment; filename='.$filename);
header('Content-Length', $filesize);

@readfile($file);

exit();

?>