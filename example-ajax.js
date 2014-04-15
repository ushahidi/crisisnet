$.ajax({
  url: 'http://devapi.crisis.net/item?sources=reliefweb',
  dataType: "json",
  beforeSend: function(xhr) {
    xhr.setRequestHeader('Authorization', 'Bearer 532d32c7ed3329652f114b70');
  },
  success: function (data) {
    console.log(data);
  }
});