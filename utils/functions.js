export const formatDuration = (durationSeconds) => {
  const minutes = (Math.floor(durationSeconds / 60)).toString().padStart(2, "0");
  const seconds = (durationSeconds % 60).toString().padStart(2, "0");
  const formattedTime = minutes + ":" + seconds;
  return formattedTime;
};

export const totalDuration = (array) => {
  // Sumar los tiempos en formato "mm:ss"
  let tiempoTotal = 0;
  console.log(array);
  for (const item of array) {
    if (item) {
      const tiempoParts = item.split(":");
      tiempoTotal += parseInt(tiempoParts[0]) * 60 + parseInt(tiempoParts[1]);
    }
  }
  // Formatear segundos
  const horas = Math.floor(tiempoTotal / 3600);
  const horasTotales = tiempoTotal % 3600;
  const minutos = Math.floor(horasTotales / 60);
  const minutosTotales = horasTotales % 60;
  const total = horas > 0
    ? `${horas}:${minutos.toString().padStart(2, "0")}:${minutosTotales.toString().padStart(2, "0")}`
    : `${minutos}:${minutosTotales.toString().padStart(2, "0")}`;
  return total;
};