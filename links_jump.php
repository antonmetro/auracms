<?php

/**
 * AuraCMS v2.2
 * auracms.org
 * December 03, 2007 07:29:56 AM 
 * Author: 	Arif Supriyanto     - arif@ayo.kliksini.com  - +622470247569
 *		Iwan Susyanto, S.Si - admin@auracms.org      - 0281 327 575 145
 *		Rumi Ridwan Sholeh  - floodbost@yahoo.com    - 0817 208 401
 * 		http://www.auracms.org
 *		http://www.iwan.or.id
 *		http://www.ridwan.or.id
 */

define('link', true);
if (isset($_GET['id'])){
include 'includes/config.php';
include 'includes/mysql.php';

$id		= int_filter($_GET['id']);
$hasil	= $koneksi_db->sql_query("SELECT url,hit,id FROM `mod_link` where id='$id'");
$data	= $koneksi_db->sql_fetchrow($hasil);
$url	= $data['url'];
$hit	= $data['hit'];
$Id	= $data['id'];
$hit	= $hit+1 ;
$hasil1 = $koneksi_db->sql_query("UPDATE `mod_link` SET `hit`=hit+1 WHERE id='$id'");
header ("location: $url");
exit;	
}
?>