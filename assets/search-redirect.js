document.addEventListener('DOMContentLoaded', function () {
  var input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && input.value.trim()) {
      window.location.href = 'index.html?q=' + encodeURIComponent(input.value.trim());
    }
  });
});
