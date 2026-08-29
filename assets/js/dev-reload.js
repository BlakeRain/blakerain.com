(function () {
  function connect() {
    const ws = new WebSocket(`ws://${location.host}/__dev/ws`);

    ws.onmessage = (e) => {
      if (e.data === "reload") {
        location.reload();
      }
    };

    ws.onclose = () => setTimeout(connect, 1000);
  }

  connect();
})();

