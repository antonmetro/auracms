var guestbook = {
url:'mod/guestbook/guestbook_admin.php',	
xmlhttp:function(){
var xmlhttp = false;
try {
xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
} catch (e) {
try {
xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
} catch (E) {
xmlhttp = false;
}
}
if (!xmlhttp && typeof XMLHttpRequest != 'undefined') {
xmlhttp = new XMLHttpRequest();
}
return xmlhttp;
},
substrdata:function(vardata,maxdata){
var txt = vardata.substring(0,maxdata);
if (vardata.length > maxdata) {txt += '...';}
return txt;
},
dhtmlLoadScript : function (url){
      var e = document.createElement("script");
	  e.src = url;
	  e.type="text/javascript";
	  document.getElementsByTagName("head")[0].appendChild(e);	  
},
loadingTextInterval: setInterval(function(){
		if (document.getElementById("ellipsis") && document.getElementById('load').style.display == 'block'){
			var dots = document.getElementById("ellipsis").innerHTML;
			document.getElementById("ellipsis").innerHTML = (dots != "...") ? dots += "." : "";
		}
	}, 500),
indexs:function(query){

boxloading('Loading');
var request = guestbook.xmlhttp();
query = (typeof query == 'undefined') ? '' : query;
request.open("GET", guestbook.url+'?'+query, true);	
request.onreadystatechange = function(){
if (request.readyState == 4 && request.status == 200){	
var auraCMS = eval("(" + request.responseText + ")");	
if (typeof auraCMS.bukutamuList != 'object'){
boxloading('Loading');
document.getElementById('respon').innerHTML = 'Tidak Ada Data';
return;	
}
var html = '';
html += '<form name="frm" id="frm"><table width="100%"><tr><td width="30%" class=tabel_header><b>Nama dan Lokasi</b></td><td width="70%" class=tabel_header><b>Komentar</b></td></tr>';
var total = auraCMS.bukutamuList.length;

if (total > 0){
for (i=0;i<total;i++){
alamat = auraCMS.bukutamuList[i].alamat.length > 14 ? guestbook.substrdata(auraCMS.bukutamuList[i].alamat,12) : auraCMS.bukutamuList[i].alamat;
html += '<tr id="trID_'+auraCMS.bukutamuList[i].id+'" style="border: 1px solid #f2f2f2;padding: 5px;">';
html += '<td width="30%" valign="top" style="border: 1px solid #f2f2f2;padding: 5px;">'+auraCMS.bukutamuList[i].sekarang+'<br>';
html += '<b><a title="'+auraCMS.bukutamuList[i].email+'">'+auraCMS.bukutamuList[i].nama+'</a></b><br>';
html += '<b>'+alamat+'</b><br><a href="'+auraCMS.bukutamuList[i].homepage+'" target=_blank title="'+auraCMS.bukutamuList[i].homepage+'"><img src="images/www.gif" border="0"></a><br> <A href="mailto:'+auraCMS.bukutamuList[i].email+'" title="'+auraCMS.bukutamuList[i].email+'"><img src="images/email.gif" border="0"></A>';
html += '</td><td width="70%" valign="top" style="border: 1px solid #f2f2f2;padding: 5px;">'+auraCMS.bukutamuList[i].komentar+'';
if (auraCMS.bukutamuList[i].jawab != "") html += '<p><table><tr><td valign="top"><b>Admin :</b></td><td><i>'+auraCMS.bukutamuList[i].jawab+'</i></td></tr></table>';
html += '</td></tr><tr style="border: 1px solid #f2f2f2;padding: 5px;"><td style="border: 1px solid #f2f2f2;padding: 5px;text-align:right;" colspan=2><a onclick="guestbook.tanggapan(\''+auraCMS.bukutamuList[i].id+'\',\''+query+'\')" style="cursor:pointer">Tanggapan</a> <input type="checkbox" name="delete[]" value="'+auraCMS.bukutamuList[i].id+'" id="chkID_'+i+'" onclick="guestbook.check(this)" style="border:0px"> Delete</td></tr>';
}
}

html += '</table>';
html += '<div class=border style="text-align:right"><input type="button" value="Delete" style="background:red;color:#fff;border:2px solid #efefef" onclick="guestbook.deleted(\'frm\',\'delete[]\',\''+query+'\')"> <input type="button" value="check all" onclick="checkall(\'frm\',\'delete[]\')"> </div>';
html += '</form>';
if (auraCMS.paging != "") {html += '<div class="border">'+auraCMS.paging+'</div>';}
document.getElementById('respon').innerHTML = html;
document.getElementById('load').style.display = 'none';
}

};
request.send(null);		
},
check:function(obj){
var ID = obj.value;
$('trID_'+ID).style.background = obj.checked ? '#FFE6F0' : '';
},
deleted:function(formName, boxName, referer){
	var TMPcheck = new Array ();
	for(i = 0; i < document.getElementById(formName).elements.length; i++)
	{
		var formElement = document.getElementById(formName).elements[i];
		if(formElement.type == 'checkbox' && formElement.name == boxName && formElement.disabled == false && formElement.checked == true)
		{
		TMPcheck.push('id[]='+formElement.value);	
		}
	}
if (TMPcheck.length <= 0){
alert ('No Selected Item(s)');
return;	
}
if (confirm('Deleted Guestbook '+TMPcheck.length+' Item(s)')){
var QueryString = TMPcheck.join('&');
if (referer.match(/\?/g,referer)){	
referer = referer.split('?');
referer = referer[1];
}
var request = guestbook.xmlhttp();
request.open("GET", guestbook.url+'?action=deleted&'+QueryString,true);	
request.onreadystatechange = function(){
if (request.readyState == 4 && request.status == 200){
guestbook.indexs(referer);	
}

};
request.send(null);
}
		
	
},
tanggapan_click:function(id,referer){
boxloading('Saving');
var tanggapan = encodeURIComponent($('frm').tanggapan.value);
var request = guestbook.xmlhttp();
request.open("GET", guestbook.url+'?action=tanggapan_saved&id='+id+'&tanggapan='+tanggapan,true);	
request.onreadystatechange = function(){
if (request.readyState == 4 && request.status == 200){
boxloading('Loading');
guestbook.indexs(referer);	
}

};
request.send(null);	
		
},
tanggapan:function(id,referer){
if (referer.match(/\?/g,referer)){	
referer = referer.split('?');
referer = referer[1];
}
boxloading('Tanggapan');
var request = guestbook.xmlhttp();
request.open("GET", guestbook.url+'?action=tanggapan&id='+id,true);	
request.onreadystatechange = function(){
if (request.readyState == 4 && request.status == 200){
var auraCMS = eval ("("+request.responseText+")");
boxloading('Tanggapan');
var html = '';
html += '<form name="frm" id="frm"><table width="100%"><tr><td width="30%" class=tabel_header><b>Nama dan Lokasi</b></td><td width="70%" class=tabel_header><b>Komentar</b></td></tr>';	
alamat = auraCMS.bukutamuList.alamat.length > 14 ? guestbook.substrdata(auraCMS.bukutamuList.alamat,12) : auraCMS.bukutamuList.alamat;
html += '<tr id="trID_'+auraCMS.bukutamuList.id+'" style="border: 1px solid #f2f2f2;padding: 5px;">';
html += '<td width="30%" valign="top" style="border: 1px solid #f2f2f2;padding: 5px;">'+auraCMS.bukutamuList.sekarang+'<br>';
html += '<b><a title="'+auraCMS.bukutamuList.email+'">'+auraCMS.bukutamuList.nama+'</a></b><br>';
html += '<b>'+alamat+'</b><br><a href="'+auraCMS.bukutamuList.homepage+'" target=_blank title="'+auraCMS.bukutamuList.homepage+'"><img src="images/www.gif" border="0"></a><br> <A href="mailto:'+auraCMS.bukutamuList.email+'" title="'+auraCMS.bukutamuList.email+'"><img src="images/email.gif" border="0"></A>';
html += '</td><td width="70%" valign="top" style="border: 1px solid #f2f2f2;padding: 5px;">'+auraCMS.bukutamuList.komentar+'';
html += '<p><b>Tanggapan :</b><br /><textarea name="tanggapan" cols=40>'+auraCMS.bukutamuList.jawab+'</textarea><input type="button" value="submit" onclick="guestbook.tanggapan_click(\''+auraCMS.bukutamuList.id+'\',\''+referer+'\')"> <input type="button" value="cancel" onclick="guestbook.indexs(\''+referer+'\')">';
html += '</td></tr><tr style="border: 1px solid #f2f2f2;padding: 5px;"><td style="border: 1px solid #f2f2f2;padding: 5px;text-align:right;" colspan=2></td></tr>';	
	
html += '</table>';

$('respon').innerHTML = html;		
	

}

};
request.send(null);

},setting_click:function() {
if ($('frm').limit.value == '') {
alert('Parameter Limit Jangan kosong');
return;	
}
if ($('frm').char.value == '') {
alert('Parameter Max. Karakter Jangan kosong');
return;	
}
boxloading('Saving');
var request = guestbook.xmlhttp();
request.open("POST",guestbook.url+'?action=setting',true);
request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
request.onreadystatechange = function(){
if (request.readyState == 4 && request.status == 200){
boxloading('Loading');
guestbook.indexs();	
}

};
request.send(postForm.getFormValues('frm')+'&submit=1');		
}
,setting:function() {
boxloading('Setting');
var request = guestbook.xmlhttp();
request.open("GET", guestbook.url+'?action=setting',true);	
request.onreadystatechange = function(){
if (request.readyState == 4 && request.status == 200){
var auraCMS = eval ("("+request.responseText+")");
boxloading('Setting');	
var html = '';
html += '<form name="frm" id="frm"><table>';
html += '<tr><td>Max. Limit</td><td>:</td><td><input type="text" name="limit" value="'+auraCMS.limit+'" /></td></tr>';
html += '<tr><td>Max. Karakter</td><td>:</td><td><input type="text" name="char" value="'+auraCMS.char+'" /></td></tr>';
html += '<tr><td></td><td></td><td><input type="button" onclick="guestbook.setting_click()" value="save" /></td></tr>';

html += '</table>';	
$('respon').innerHTML = html;
}

};
request.send(null);
}
	
	
	
	
	
};
boxloading=function(pesan){
var posisi_top = 0;
if (navigator.appName == "Microsoft Internet Explorer")
	{
		posisi_top = parseInt(document.documentElement.scrollTop + (screen.height/3));
	}
	else
	{
		posisi_top = parseInt(window.pageYOffset + (screen.height/3));
	}
var lebar = pesan.length * 6 + 40;
document.getElementById('load').style.width = lebar + 'px';
document.getElementById('load').style.top = posisi_top + 'px';
document.getElementById('load').style.display = document.getElementById('load').style.display == 'none' ? 'block' : 'none';	
document.getElementById('loadmessage').innerHTML = pesan;
};
$=function(e){return document.getElementById(e);};
var all_checked = true;
checkall=function(formName, boxName) {
	
	for(i = 0; i < document.getElementById(formName).elements.length; i++)
	{
		var formElement = document.getElementById(formName).elements[i];
		if(formElement.type == 'checkbox' && formElement.name == boxName && formElement.disabled == false)
		{
			formElement.checked = all_checked;
			$('trID_'+formElement.value).style.background = formElement.checked ? '#FFE6F0' : '';
		}
	}	
all_checked = all_checked ? false : true;
};
$('headerajax').innerHTML = '<div class="border"><a onclick="guestbook.indexs()" style="cursor:pointer;">Guestbook</a> | <a onclick="guestbook.setting()" style="cursor:pointer;">Setting</a></div>';