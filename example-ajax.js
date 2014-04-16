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

$.ajax({
  url: 'http://localhost:8083/request',
  dataType: "json",
  beforeSend: function(xhr) {
    xhr.setRequestHeader('Authorization', 'Bearer 532d1bb6bbcdd1862d6e15b4');
  },
  success: function (data) {
    console.log(data);
  }
});

$.ajax({
  url: 'http://localhost:8083/item?location=36.821946,-1.292066',
  dataType: "json",
  beforeSend: function(xhr) {
    xhr.setRequestHeader('Authorization', 'Bearer 532d1bb6bbcdd1862d6e15b4');
  },
  success: function (data) {
    console.log(data);
  }
});