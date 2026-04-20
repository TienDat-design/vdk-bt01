const client = new Paho.MQTT.Client("broker.emqx.io", 8083, "web_" + Math.random());

const statusEl = document.getElementById("status-val");
const dotEl = document.getElementById("conn-dot");
const carEl = document.getElementById("car-val");
const barrierArmEl = document.getElementById("barrier-arm");

function setStatus(text, type) {
  statusEl.innerText = text;
  statusEl.classList.remove("color-success", "color-warning", "color-danger");
  if (type) statusEl.classList.add(type);
}

function setBarrierState(state) {
  if (!barrierArmEl) return;

  barrierArmEl.classList.remove("up", "down", "moving");
  barrierArmEl.classList.add(state, "moving");

  setTimeout(function () {
    barrierArmEl.classList.remove("moving");
  }, 650);
}

function updateBarrierByStatus(statusText) {
  if (!statusText) return;

  if (
    statusText.includes("MỞ") ||
    statusText.includes("CHO QUA") ||
    statusText.includes("XE RA") ||
    statusText.includes("SẴN SÀNG")
  ) {
    setBarrierState("up");
    return;
  }

  if (
    statusText.includes("ĐÓNG") ||
    statusText.includes("ĐẦY") ||
    statusText.includes("LỖI") ||
    statusText.includes("MẤT")
  ) {
    setBarrierState("down");
    return;
  }
}

client.onConnectionLost = function () {
  setStatus("MẤT KẾT NỐI", "color-danger");
  setBarrierState("down");
  dotEl.classList.remove("online");
  document.getElementById("log-val").innerText = "Offline";
};

client.onMessageArrived = function (message) {
  try {
    const data = JSON.parse(message.payloadString);

    document.getElementById("car-val").innerText = data.soXe;
    document.getElementById("max-val").innerText = data.maxXe;
    document.getElementById("dist-val").innerText = data.khoangCach;

    carEl.classList.remove("color-danger");

    if (data.trangThai.includes("LỖI")) {
      setStatus(data.trangThai, "color-danger");
      carEl.classList.add("color-danger");
    } else if (data.trangThai.includes("ĐẦY")) {
      setStatus(data.trangThai, "color-warning");
    } else {
      setStatus(data.trangThai, "color-success");
    }

    updateBarrierByStatus(data.trangThai);
  } catch (error) {
    console.log(error);
  }
};

client.connect({
  onSuccess: function () {
    dotEl.classList.add("online");
    setStatus("ĐÃ KẾT NỐI", "color-success");
    setBarrierState("down");
    document.getElementById("log-val").innerText = "Online";
    client.subscribe("tram-kiem-soat/trang-thai");
  }
});

function carExit() {
  const msg = new Paho.MQTT.Message("CAR_EXIT");
  msg.destinationName = "tram-kiem-soat/dieu-khien";
  client.send(msg);
}
