async function removeKYZReserved() {
  // Подтверждение
  if (!confirm("Вы уверены, что хотите снять КИЗ с резервов?")) {
    return;
  }

  const statusProgram = JSON.parse(localStorage.getItem("statusProgram"));
  if (!statusProgram || !statusProgram.brand) {
    alert("❌ Сначала выберите бренд!");
    return;
  }

  const brand = statusProgram.brand;

  // Показываем оверлей
  const overlay = document.getElementById("overlay");
  const timerElement = document.getElementById("timer");
  overlay.style.display = "flex";

  let seconds = 0;
  const intervalId = setInterval(() => {
    seconds++;
    timerElement.textContent = seconds;
  }, 1000);

  try {
    const response = await fetch(
      `http://${window.location.hostname}:3000/removeKYZReserves?brand=${brand}`
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error(`Ошибка при снятии с резерва: ${response.status} ${errorDetails}`);
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    // Сохраняем результат для показа после перезагрузки
    localStorage.setItem("removeKYZResult", JSON.stringify(data));

    // Перезагружаем
    window.location.reload();
  } catch (err) {
    console.error("Ошибка выполнения removeKYZReserved:", err.message);
    alert("Произошла ошибка при снятии с резерва!");
  } finally {
    clearInterval(intervalId);
    overlay.style.display = "none"; // на всякий случай, если не перезагрузим
  }
}

// Сообщение после перезагрузки
window.addEventListener("load", () => {
  const result = localStorage.getItem("removeKYZResult");
  if (result) {
    const parsed = JSON.parse(result);

    alert(
      `✅ Снятие резервов завершено!\n\n` +
      `Бренд: ${parsed.brand}\n` +
      `Успешно снято: ${parsed.successCount}\n` +
      `Ошибок: ${parsed.failCount}`
    );

    localStorage.removeItem("removeKYZResult");
  }
});
