// функция для получения API tokens
const getApiById = async (id, company_name, category) => {
    try {
      const response = await fetch(
        `http://${window.location.hostname}:3000/getApiById?id=${id}&company_name=${company_name}&category=${category}`
      );
  
      if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`Ошибка получения токена: ${response.status} ${errorDetails}`);
        throw new Error(`HTTP error ${response.status}`);
      }
  
      const data = await response.json();
  
      if (!data.token) {
        throw new Error(`Токен отсутствует в ответе: ${JSON.stringify(data)}`);
      }
  
      return data.token;
    } catch (err) {
      console.error('Ошибка выполнения getApiById:', err.message);
      throw err; // Повторно выбрасываем ошибку для обработки выше
    }
};