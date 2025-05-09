const historyData = {};

let currentChart = null;

// Khôi phục dữ liệu từ localStorage nếu có (nghĩa là khi reload trang lại thì giữ nguyên lịch sử....chắc vậy)
let savedData = localStorage.getItem("historyData");
if (savedData) {
  Object.assign(historyData, JSON.parse(savedData));
}

function calculate() {
  //Tùy à để xem sao
  document.getElementById("history").style.display = "none";
  document.getElementById("inputSection").style.display = "block";
  //----------------
  const name = document.getElementById("sampleName").value.trim();
  const edtaVolume = parseFloat(document.getElementById("edtaVolume").value);
  const edtaConcentration = parseFloat(document.getElementById("edtaConcentration").value);
  const waterVolume = parseFloat(document.getElementById("waterVolume").value);

  if (!name || isNaN(edtaVolume) || isNaN(edtaConcentration) || isNaN(waterVolume)) {
    alert("Chưa có số liệu thì đo bằng niềm tin à =))))??????");
    return;
  }

  const resultCa = (edtaVolume * edtaConcentration) * 100 * (1000 / waterVolume) * 0.4;
  const timestamp = new Date().toLocaleString();

  let classification = "";
  let advice = "";

  if (resultCa < 60) {
    classification = "Nước mềm";
    advice = "Nguồn nước ổn định, có thể sử dụng sinh hoạt";
  } else if (resultCa < 120) {
    classification = "Hơi cứng";
    advice = "Nguồn nước tương đối ổn, có thể theo dõi thêm";
  } else if (resultCa < 180) {
    classification = "Cứng";
    advice = "Nên xem xét thiết bị lọc/làm mềm nước";
  } else {
    classification = "Rất cứng";
    advice = "Nguy cơ đóng cặn – nên sử dụng thiết bị làm mềm nước";
  }

  if (!historyData[name]) historyData[name] = [];

  const entry = {
    value: resultCa,
    classification: classification,
    advice: advice,
    time: timestamp
  };
  historyData[name].push(entry);

  // Lưu lại lịch sử vào localStorage
  localStorage.setItem("historyData", JSON.stringify(historyData));

  renderResult(name, entry);
}

function renderResult(name, entry) {
  const resultDiv = document.getElementById("result");
  resultDiv.style.display = "block";

  let html = `
    <strong>Mẫu nước:</strong> ${name}<br/>
    <strong>Hàm lượng Ca²⁺:</strong> ${entry.value.toFixed(2)} mg/L<br/>
    <strong>Phân loại:</strong> ${entry.classification}<br/>
    <strong>Gợi ý:</strong> ${entry.advice}<br/>
    <strong>Thời gian đo:</strong> ${entry.time}<br/>
  `;

  const count = historyData[name].length;
  if (count >= 2) {
    html += `
      <hr>
      <p><strong>Đã có ${count} lần đo với mẫu "${name}".</strong></p>
      <button onclick="showComparisonOptions('${name}')">🔍 So sánh kết quả</button>
    `;
  }

  resultDiv.innerHTML = html;
  clearCanvas();
}

function showComparisonOptions(name) {
  const resultDiv = document.getElementById("result");

  let html = `<h4>Chọn cách so sánh:</h4>`;
  html += `
    <button onclick="showTwoCompare('${name}')">So sánh 2 lần đo cụ thể</button>
    <button onclick="showTrend('${name}')">So sánh quá trình</button>
    <div id="compareArea"></div>
  `;
  resultDiv.innerHTML += html;
}

function showTwoCompare(name) {
  const data = historyData[name];
  const compareArea = document.getElementById("compareArea");

  let html = `
    <label>Chọn 2 lần đo:</label><br/>
    <select id="compare1">
      ${data.map((_, i) => `<option value="${i}">Lần ${i + 1}</option>`).join("")}
    </select>
    <select id="compare2">
      ${data.map((_, i) => `<option value="${i}">Lần ${i + 1}</option>`).join("")}
    </select>
    <button onclick="drawBarChart('${name}')">So sánh</button>
    <canvas id="chartArea" width="400" height="250"></canvas>
  `;
  compareArea.innerHTML = html;
}

function drawBarChart(name) {
  const data = historyData[name];
  const i1 = parseInt(document.getElementById("compare1").value);
  const i2 = parseInt(document.getElementById("compare2").value);

  if (i1 === i2) {
    alert("Bạn cần so sánh 2 kết quả khác nhau")
    
  }
    

  const labels = [`Lần ${i1 + 1} (${data[i1].time})`, `Lần ${i2 + 1} (${data[i2].time})`];
  const values = [data[i1].value, data[i2].value];

  const ctx = document.getElementById("chartArea").getContext("2d");
  if (currentChart) {
    currentChart.destroy();
  }
  
  currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: `Hàm lượng Ca²⁺ của mẫu "${name}"`,
        data: values,
        backgroundColor: ['#888', '#4ca3dd']
      }]
    },
    options: {
      responsive: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'mg/L Ca²⁺' }
        }
      }
    }
  });
}

function showTrend(name) {
  const data = historyData[name];
  const labels = data.map((entry, i) => `Lần ${i + 1}`);
  const values = data.map(entry => entry.value);

  const compareArea = document.getElementById("compareArea");
  compareArea.innerHTML = `<canvas id="chartArea" width="400" height="250"></canvas>`;

  const ctx = document.getElementById("chartArea").getContext("2d");
  if (currentChart) {
    currentChart.destroy();
  }
  
  currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `Diễn biến Ca²⁺ mẫu "${name}"`,
        data: values,
        fill: false,
        borderColor: '#4ca3dd',
        tension: 0.2
      }]
    },
    options: {
      responsive: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'mg/L Ca²⁺' }
        }
      }
    }
  });
}

function showHistory() {
  // Ẩn phần nhập và kết quả
  document.getElementById("inputSection").style.display = "none";
  document.getElementById("result").style.display = "none";
  // Hiện phần lịch sử
  const historyDiv = document.getElementById("history");
  historyDiv.style.display = "block";
  //Nếu Chưa mẫu nào được nhập
  if (Object.keys(historyData).length === 0) {
    historyDiv.innerHTML = "<em>Chưa có mẫu nào được đo thì vào đây làm gì,quay lại đo đi má, rồi mới có kết quả.</em><br><button onclick='backToInput()'>← Quay lại</button>";
    return;
  }

  let html = "<h3>Lịch sử các mẫu đã đo:</h3><ul>";
  for (const [name, records] of Object.entries(historyData)) {
    html += `<li><strong>${name}</strong> (${records.length} lần):<ul>`;
    records.forEach((entry, i) => {
      html += `<li>Lần ${i + 1} – ${entry.value.toFixed(2)} mg/L – ${entry.classification} – ${entry.time}</li>`;
    });
  html += "</ul></li>";
}
html += "</ul>";

// 👇 Thêm phần chọn mẫu để xóa và nút xóa tất cả
html += `
  <hr>
  <h4>Xóa lịch sử:</h4>
  <label for="deleteSample">Chọn mẫu để xóa:</label>
  <select id="deleteSample">
    ${Object.keys(historyData).map(name => `<option value="${name}">${name}</option>`).join("")}
  </select>
  <button onclick="deleteSample()">❌ Xóa mẫu này</button>
  <br><br>
  <button onclick="deleteAll()">🔥 Xóa toàn bộ lịch sử</button>
`;

// Nút quay lại
html += `<br><button onclick="backToInput()">← Quay lại</button>`;
historyDiv.innerHTML = html;
}

function backToInput() {
  document.getElementById("inputSection").style.display = "block";
  document.getElementById("history").style.display = "none";
  document.getElementById("result").style.display = "none";
}

function deleteSample() {
  const select = document.getElementById("deleteSample");
  const nameToDelete = select.value;
  if (confirm(`Bạn chắc chắn muốn xóa toàn bộ kết quả của mẫu "${nameToDelete}"?`)) {
    delete historyData[nameToDelete];
    localStorage.setItem("historyData", JSON.stringify(historyData));
    alert(`Đã xóa mẫu "${nameToDelete}".`);
    showHistory(); // Cập nhật lại giao diện
  }
}

function deleteAll() {
  if (confirm("Bạn chắc chắn muốn xóa TẤT CẢ lịch sử đo không? Hành động này không thể hoàn tác!")) {
    for (let key in historyData) delete historyData[key];
    localStorage.removeItem("historyData");
    alert("Đã xóa toàn bộ lịch sử.");
    showHistory(); // Cập nhật lại giao diện
  }
}
