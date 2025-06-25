// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del HTML
    const odds1Input = document.getElementById('odds1');
    const betAmount1Input = document.getElementById('betAmount1');
    const odds2Input = document.getElementById('odds2');
    const betAmount2Input = document.getElementById('betAmount2');
    const totalInvestmentInput = document.getElementById('totalInvestment');
    const guaranteedProfitInput = document.getElementById('guaranteedProfit');
    const surebetPercentageInput = document.getElementById('surebetPercentage');

    // Elemento para mostrar el estado de la actualización de cuotas
    const statusDiv = document.createElement('div');
    statusDiv.id = 'status';
    statusDiv.style.marginTop = '20px';
    statusDiv.style.fontSize = '0.85em';
    statusDiv.style.color = '#6c757d'; // Color gris por defecto
    document.querySelector('.container').appendChild(statusDiv); // Añadirlo al contenedor principal de la calculadora

    // --- Función para obtener cuotas de tu Función Netlify ---
    async function fetchOdds() {
        statusDiv.textContent = 'Actualizando cuotas...';
        statusDiv.style.color = '#007bff'; // Color azul para el estado de carga
        try {
            // **URL CLAVE:** Aquí es donde tu frontend llama a tu backend en la nube.
            // Cuando estés desarrollando y probando localmente con Netlify CLI, usa '/.netlify/functions/get-odds'.
            // Una vez que despliegues en Netlify, esta será la URL final de tu función.
            const response = await fetch('/.netlify/functions/get-odds'); 

            if (!response.ok) {
                // Si la respuesta no es OK (ej. 404, 500), intentar leer el mensaje de error del backend
                const errorData = await response.json();
                throw new Error(`Error HTTP: ${response.status} - ${errorData.error || response.statusText}`);
            }
            const data = await response.json(); // Parsear la respuesta JSON

            // Actualizar los campos de cuotas en la interfaz de usuario
            odds1Input.value = data.odds1.toFixed(2);
            odds2Input.value = data.odds2.toFixed(2);
            
            // Mostrar la hora de la última actualización
            statusDiv.textContent = `Cuotas actualizadas: ${new Date(data.timestamp).toLocaleTimeString()}`;
            statusDiv.style.color = '#28a745'; // Color verde para indicar éxito

            // Volver a calcular el arbitraje con las nuevas cuotas obtenidas
            calculateArbitrage(); 

        } catch (error) {
            console.error('Error al obtener las cuotas de la función:', error);
            statusDiv.textContent = `Error al cargar cuotas: ${error.message}`;
            statusDiv.style.color = '#dc3545'; // Color rojo para indicar error
            // Puedes dejar los campos vacíos o mostrar "N/A" si prefieres
            // odds1Input.value = '';
            // odds2Input.value = '';
        }
    }

    // --- Función principal de cálculo de arbitraje (tu código original) ---
    // Esta función no ha cambiado, solo se llama desde fetchOdds y los event listeners de los montos
    function calculateArbitrage(editedInput = null) {
        const odds1 = parseFloat(odds1Input.value);
        const odds2 = parseFloat(odds2Input.value);
        let betAmount1 = parseFloat(betAmount1Input.value);
        let betAmount2 = parseFloat(betAmount2Input.value);

        // 1. Limpiar campos de salida y estilos inicialmente
        totalInvestmentInput.value = '';
        guaranteedProfitInput.value = '';
        surebetPercentageInput.value = '';
        guaranteedProfitInput.style.color = '#495057'; // Color de texto normal

        // Quitar resaltado de ambos campos de monto por defecto
        betAmount1Input.classList.remove('highlight-input');
        betAmount2Input.classList.remove('highlight-input');

        // 2. Validar cuotas: Ambas deben ser números válidos y mayores que 1
        if (isNaN(odds1) || odds1 <= 1 || isNaN(odds2) || odds2 <= 1) {
            guaranteedProfitInput.value = 'Ingrese cuotas válidas';
            guaranteedProfitInput.style.color = '#dc3545'; // Rojo para error
            betAmount1Input.value = ''; // Limpiamos los montos si las cuotas no son válidas
            betAmount2Input.value = '';
            return;
        }

        // 3. Calcular el porcentaje de arbitraje (siempre se calcula si las cuotas son válidas)
        const impliedProb1 = 1 / odds1;
        const impliedProb2 = 1 / odds2;
        const totalImpliedProbability = impliedProb1 + impliedProb2;
        const surebetPercentage = (1 - totalImpliedProbability) * 100;
        surebetPercentageInput.value = `${surebetPercentage.toFixed(2)} %`;

        // 4. Determinar si hay oportunidad de arbitraje
        if (surebetPercentage <= 0) {
            guaranteedProfitInput.value = 'No hay arbitraje';
            guaranteedProfitInput.style.color = '#dc3545'; // Rojo para no arbitraje
            betAmount1Input.value = ''; // Limpiamos los montos si no hay arbitraje
            betAmount2Input.value = '';
            return; // Detener ejecución si no hay arbitraje
        }

        // 5. Lógica principal para determinar qué monto calcular basado en el último campo editado
        let fixedBetAmount = 0;
        let fixedOdds = 0;
        let otherOdds = 0;
        let otherBetInput = null;

        // PRIORIZAR EL CAMPO QUE FUE RECIENTEMENTE EDITADO POR EL USUARIO
        if (editedInput === betAmount1Input && !isNaN(betAmount1) && betAmount1 > 0) {
            fixedBetAmount = betAmount1;
            fixedOdds = odds1;
            otherOdds = odds2;
            otherBetInput = betAmount2Input;
            betAmount1Input.classList.add('highlight-input');
        } else if (editedInput === betAmount2Input && !isNaN(betAmount2) && betAmount2 > 0) {
            fixedBetAmount = betAmount2;
            fixedOdds = odds2;
            otherOdds = odds1;
            otherBetInput = betAmount1Input;
            betAmount2Input.classList.add('highlight-input');
        } 
        // Si no se pasó un editedInput específico, o el editedInput no tiene un monto válido,
        // entonces revisamos cuál de los campos de monto tiene un valor válido para continuar el cálculo.
        // Esto es crucial para cuando las cuotas cambian o al cargar la página.
        else if (!isNaN(betAmount1) && betAmount1 > 0) {
            fixedBetAmount = betAmount1;
            fixedOdds = odds1;
            otherOdds = odds2;
            otherBetInput = betAmount2Input;
            betAmount1Input.classList.add('highlight-input');
        } else if (!isNaN(betAmount2) && betAmount2 > 0) {
            fixedBetAmount = betAmount2;
            fixedOdds = odds2;
            otherOdds = odds1;
            otherBetInput = betAmount1Input;
            betAmount2Input.classList.add('highlight-input');
        }
        else {
            // Si las cuotas son válidas pero NO hay ningún monto de apuesta ingresado (ni fijo ni validado previamente)
            guaranteedProfitInput.value = 'Ingrese un monto de apuesta';
            guaranteedProfitInput.style.color = '#007bff'; // Azul para indicación
            return; // Detener la ejecución si no hay un monto de referencia para calcular
        }

        // 6. Calcular el monto a apostar en la otra casa
        const payoutIfFixedOddsWins = fixedOdds * fixedBetAmount;
        const calculatedOtherBetAmount = payoutIfFixedOddsWins / otherOdds;

        // Asignar el monto calculado al campo correspondiente
        if (otherBetInput) {
            otherBetInput.value = calculatedOtherBetAmount.toFixed(2);
        }

        // 7. Calcular la Inversión Total y la Ganancia Garantizada
        const finalBet1 = parseFloat(betAmount1Input.value); // Leer los valores actualizados
        const finalBet2 = parseFloat(betAmount2Input.value);

        const totalInvestment = finalBet1 + finalBet2;
        const guaranteedProfit = payoutIfFixedOddsWins - totalInvestment;

        totalInvestmentInput.value = `S/ ${totalInvestment.toFixed(2)}`;
        guaranteedProfitInput.value = `S/ ${guaranteedProfit.toFixed(2)}`;
        guaranteedProfitInput.style.color = '#28a745'; // Verde para ganancia
    }

    // --- Event Listeners ---
    // Los listeners de cuotas ya no son necesarios directamente, la función fetchOdds se encarga de eso.

    // Event listeners para los montos de apuesta: pasan el input que fue editado.
    betAmount1Input.addEventListener('input', (event) => {
        if (event.target.value === '') { // Si el usuario borra el contenido
            betAmount2Input.value = ''; 
            totalInvestmentInput.value = '';
            guaranteedProfitInput.value = 'Ingrese un monto de apuesta';
            surebetPercentageInput.value = '';
            guaranteedProfitInput.style.color = '#007bff';
            betAmount1Input.classList.remove('highlight-input');
            return;
        }
        calculateArbitrage(betAmount1Input); // Pasa betAmount1Input como el campo editado
    });

    betAmount2Input.addEventListener('input', (event) => {
        if (event.target.value === '') { // Si el usuario borra el contenido
            betAmount1Input.value = ''; 
            totalInvestmentInput.value = '';
            guaranteedProfitInput.value = 'Ingrese un monto de apuesta';
            surebetPercentageInput.value = '';
            guaranteedProfitInput.style.color = '#007bff';
            betAmount2Input.classList.remove('highlight-input');
            return;
        }
        calculateArbitrage(betAmount2Input); // Pasa betAmount2Input como el campo editado
    });

    // Añadir un listener de 'focus' para limpiar el campo contrario cuando el usuario decide cambiar el monto de referencia
    betAmount1Input.addEventListener('focus', () => {
        if (betAmount2Input.value !== '') { 
            betAmount2Input.value = '';
        }
        betAmount2Input.classList.remove('highlight-input'); 
        betAmount1Input.classList.add('highlight-input'); 
        calculateArbitrage(betAmount1Input); // Volver a calcular con el foco en este campo
    });

    betAmount2Input.addEventListener('focus', () => {
        if (betAmount1Input.value !== '') {
            betAmount1Input.value = '';
        }
        betAmount1Input.classList.remove('highlight-input');
        betAmount2Input.classList.add('highlight-input');
        calculateArbitrage(betAmount2Input); // Volver a calcular con el foco en este campo
    });

    // --- Cargar cuotas al iniciar la página y luego periódicamente ---
    fetchOdds(); // Llama a la función la primera vez al cargar la página
    // Actualiza las cuotas cada 10 segundos (ajusta este valor si necesitas más o menos frecuencia)
    setInterval(fetchOdds, 10000); 
});