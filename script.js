// CT2 Rechenhilfe JavaScript Implementation
// Based on the original Prescaler.sh bash script

// Navigation handling
document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const calculators = document.querySelectorAll('.calculator');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetCalculator = this.getAttribute('data-calculator');
            
            // Remove active class from all buttons and calculators
            navButtons.forEach(btn => btn.classList.remove('active'));
            calculators.forEach(calc => calc.classList.remove('active'));
            
            // Add active class to clicked button and corresponding calculator
            this.classList.add('active');
            document.getElementById(targetCalculator + '-calculator').classList.add('active');
        });
    });
});

// Utility functions
function formatNumber(num, decimals = 2) {
    return parseFloat(num).toFixed(decimals);
}

function formatHex(num) {
    return '0x' + num.toString(16).toUpperCase();
}

function createResultHTML(title, content) {
    return `<div class="result-section"><h3>${title}</h3>${content}</div>`;
}

// 1. Prescaler and ARR Calculator
function calculatePrescaler() {
    const clockFreq = parseFloat(document.getElementById('clock-freq').value);
    const targetTime = parseFloat(document.getElementById('target-time').value);
    const bits = parseInt(document.getElementById('timer-bits').value);
    const fixedPrescaler = document.getElementById('fixed-prescaler').value;
    
    if (!clockFreq || !targetTime || !bits) {
        document.getElementById('prescaler-result').innerHTML = '<p class="error">Bitte alle Pflichtfelder ausfüllen.</p>';
        return;
    }
    
    const maxCount = Math.pow(2, bits) - 1;
    const totalTicks = clockFreq * targetTime;
    
    let resultHTML = `<h3>Timer Konfiguration</h3>`;
    resultHTML += `<p>Max Counter Wert für ${bits}-bit Timer: ${maxCount}</p>`;
    resultHTML += `<p>Benötigte Ticks gesamt: ${Math.round(totalTicks)}</p>`;
    
    resultHTML += `<h4>Grundlagen Rechenweg:</h4>`;
    resultHTML += `<p>• Max Counter = 2^${bits} - 1 = ${Math.pow(2, bits)} - 1 = ${maxCount}</p>`;
    resultHTML += `<p>• Benötigte Ticks = Frequenz × Zeit = ${clockFreq} Hz × ${targetTime} s = ${formatNumber(totalTicks)} Ticks</p>`;
    
    if (fixedPrescaler) {
        // Fixed prescaler calculation
        const prescaler = parseInt(fixedPrescaler);
        const effectiveFreq = clockFreq / prescaler;
        const counterVal = totalTicks / prescaler;
        const counterValRounded = Math.round(counterVal);
        
        resultHTML += `<h4>Berechnung mit festem Prescaler:</h4>`;
        resultHTML += `<p>Prescaler: ${prescaler}</p>`;
        resultHTML += `<p>Effektive Frequenz: ${formatNumber(effectiveFreq)} Hz</p>`;
        resultHTML += `<p>Benötigter ARR (exakt): ${formatNumber(counterVal)}</p>`;
        resultHTML += `<p>Benötigter ARR (gerundet): ${counterValRounded}</p>`;
        
        resultHTML += `<h5>Detaillierter Rechenweg:</h5>`;
        resultHTML += `<p>• Effektive Frequenz = Clock Frequenz / Prescaler = ${clockFreq} / ${prescaler} = ${formatNumber(effectiveFreq)} Hz</p>`;
        resultHTML += `<p>• ARR (exakt) = Benötigte Ticks / Prescaler = ${formatNumber(totalTicks)} / ${prescaler} = ${formatNumber(counterVal)}</p>`;
        resultHTML += `<p>• ARR (gerundet) = ${counterValRounded}</p>`;
        
        if (counterValRounded <= maxCount) {
            const prescalerReg = prescaler - 1;
            const arrReg = counterValRounded - 1;
            const actualTime = (prescaler * counterValRounded) / clockFreq;
            const timeError = actualTime - targetTime;
            const timeErrorMs = timeError * 1000;
            
            resultHTML += `<div class="solution">`;
            resultHTML += `<h4>LÖSUNG:</h4>`;
            resultHTML += `<p><strong>Prescaler Register Wert:</strong> ${prescalerReg} (${formatHex(prescalerReg)})</p>`;
            resultHTML += `<p><strong>ARR Register Wert:</strong> ${arrReg} (${formatHex(arrReg)})</p>`;
            resultHTML += `<p><strong>ARR Counter Wert:</strong> ${counterValRounded}</p>`;
            
            resultHTML += `<h5>Register Rechenweg:</h5>`;
            resultHTML += `<p>• Prescaler Register = Prescaler - 1 = ${prescaler} - 1 = ${prescalerReg}</p>`;
            resultHTML += `<p>• ARR Register (Reload-Wert) = ARR Counter - 1 = ${counterValRounded} - 1 = ${arrReg}</p>`;
            resultHTML += `<p>• Reload-Bedeutung: Timer zählt von 0 bis ${arrReg}, dann Reload auf ${arrReg}</p>`;
            resultHTML += `<p>• Counter-Zyklen: 0, 1, 2, ..., ${arrReg} → ${counterValRounded} verschiedene Zustände</p>`;
            
            resultHTML += `<h5>Verifikation:</h5>`;
            resultHTML += `<p>• Tatsächliche Zeit = (Prescaler × ARR Counter) / Clock Frequenz = (${prescaler} × ${counterValRounded}) / ${clockFreq} = ${formatNumber(actualTime, 6)} s</p>`;
            resultHTML += `<p>• Zielzeit: ${formatNumber(targetTime * 1000)} ms</p>`;
            resultHTML += `<p>• Tatsächliche Zeit: ${formatNumber(actualTime * 1000)} ms</p>`;
            resultHTML += `<p>• Zeitfehler: ${formatNumber(timeErrorMs)} ms</p>`;
            resultHTML += `<p>• Frequenz: ${formatNumber(1 / actualTime)} Hz</p>`;
            resultHTML += `</div>`;
        } else {
            resultHTML += `<p class="error">FEHLER: Benötigter ARR (${counterValRounded}) überschreitet ${bits}-bit Timer Kapazität (${maxCount})</p>`;
            resultHTML += `<p>Versuchen Sie einen größeren Prescaler Wert oder kürzeres Zeitintervall.</p>`;
        }
    } else {
        // Try different prescaler values
        resultHTML += `<h4>Mögliche Konfigurationen:</h4>`;
        const prescalerValues = [1, 2, 4, 8, 16, 21, 32, 64, 100, 256, 512, 1000, 8400];
        let foundSolutions = false;
        
        prescalerValues.forEach(prescaler => {
            const counterVal = Math.round(totalTicks / prescaler);
            
            if (counterVal <= maxCount && counterVal > 0) {
                const prescalerReg = prescaler - 1;
                const arrReg = counterVal - 1;
                const exactTime = (prescaler * counterVal) / clockFreq;
                
                resultHTML += `<div class="config-option">`;
                resultHTML += `<p><strong>Prescaler:</strong> ${prescaler} (Register: ${formatHex(prescalerReg)})</p>`;
                resultHTML += `<p><strong>ARR Counter Wert:</strong> ${counterVal}</p>`;
                resultHTML += `<p><strong>ARR Register (Reload-Wert):</strong> ${arrReg} (${formatHex(arrReg)})</p>`;
                resultHTML += `<p><strong>Reload-Bedeutung:</strong> Timer zählt 0→${arrReg}, dann Reload</p>`;
                resultHTML += `<p><strong>Exakte Zeit:</strong> ${formatNumber(exactTime, 6)} Sekunden</p>`;
                resultHTML += `</div>`;
                foundSolutions = true;
            }
        });
        
        if (!foundSolutions) {
            resultHTML += `<p class="error">Keine passenden Konfigurationen gefunden. Versuchen Sie andere Parameter.</p>`;
        }
    }
    
    document.getElementById('prescaler-result').innerHTML = resultHTML;
}

// 2. PWM Calculator
function calculatePWM() {
    const arrValue = document.getElementById('arr-value').value;
    const dutyCycle = document.getElementById('duty-cycle').value;
    const ccrValue = document.getElementById('ccr-value').value;
    const clockFreq = document.getElementById('pwm-clock-freq').value;
    const prescaler = document.getElementById('pwm-prescaler').value;
    
    let resultHTML = `<h3>PWM Konfiguration</h3>`;
    
    // Validate input combinations
    const hasArr = arrValue !== '';
    const hasDuty = dutyCycle !== '';
    const hasCcr = ccrValue !== '';
    
    const filledInputs = [hasArr, hasDuty, hasCcr].filter(Boolean).length;
    
    if (filledInputs !== 2) {
        resultHTML += `<p class="error">Bitte geben Sie genau 2 der 3 Werte an (ARR, Duty Cycle %, CCR)</p>`;
        document.getElementById('pwm-result').innerHTML = resultHTML;
        return;
    }
    
    let finalArrValue, finalDutyCycle, finalCcrValue;
    
    if (hasArr && hasDuty && !hasCcr) {
        // Calculate CCR from ARR and duty cycle
        finalArrValue = parseInt(arrValue);
        finalDutyCycle = parseFloat(dutyCycle);
        const ccrCalc = (finalArrValue + 1) * finalDutyCycle / 100;
        finalCcrValue = Math.round(ccrCalc);
        const actualDuty = finalCcrValue * 100 / (finalArrValue + 1);
        
        resultHTML += `<p>Gegeben: ARR=${finalArrValue}, Duty Cycle=${finalDutyCycle}%</p>`;
        resultHTML += `<p><strong>Berechneter CCR:</strong> ${finalCcrValue} (${formatHex(finalCcrValue)})</p>`;
        resultHTML += `<p><strong>Tatsächlicher Duty Cycle:</strong> ${formatNumber(actualDuty)}%</p>`;
        
        resultHTML += `<h4>Rechenweg:</h4>`;
        resultHTML += `<p>• CCR (exakt) = (ARR + 1) × Duty Cycle / 100 = (${finalArrValue} + 1) × ${finalDutyCycle} / 100 = ${formatNumber(ccrCalc, 3)}</p>`;
        resultHTML += `<p>• CCR (gerundet) = ${finalCcrValue}</p>`;
        resultHTML += `<p>• Tatsächlicher Duty Cycle = CCR × 100 / (ARR + 1) = ${finalCcrValue} × 100 / (${finalArrValue} + 1) = ${formatNumber(actualDuty, 3)}%</p>`;
        
    } else if (hasArr && !hasDuty && hasCcr) {
        // Calculate duty cycle from ARR and CCR
        finalArrValue = parseInt(arrValue);
        finalCcrValue = parseInt(ccrValue);
        finalDutyCycle = finalCcrValue * 100 / (finalArrValue + 1);
        
        resultHTML += `<p>Gegeben: ARR=${finalArrValue}, CCR=${finalCcrValue}</p>`;
        resultHTML += `<p><strong>Berechneter Duty Cycle:</strong> ${formatNumber(finalDutyCycle)}%</p>`;
        
        resultHTML += `<h4>Rechenweg:</h4>`;
        resultHTML += `<p>• Duty Cycle = CCR × 100 / (ARR + 1) = ${finalCcrValue} × 100 / (${finalArrValue} + 1) = ${formatNumber(finalDutyCycle, 3)}%</p>`;
        
    } else if (!hasArr && hasDuty && hasCcr) {
        // Calculate ARR from duty cycle and CCR
        finalDutyCycle = parseFloat(dutyCycle);
        finalCcrValue = parseInt(ccrValue);
        finalArrValue = Math.round((finalCcrValue * 100 / finalDutyCycle) - 1);
        const actualDuty = finalCcrValue * 100 / (finalArrValue + 1);
        
        resultHTML += `<p>Gegeben: Duty Cycle=${finalDutyCycle}%, CCR=${finalCcrValue}</p>`;
        resultHTML += `<p><strong>Berechneter ARR:</strong> ${finalArrValue} (${formatHex(finalArrValue)})</p>`;
        resultHTML += `<p><strong>Tatsächlicher Duty Cycle:</strong> ${formatNumber(actualDuty)}%</p>`;
        
        resultHTML += `<h4>Rechenweg:</h4>`;
        resultHTML += `<p>• ARR = (CCR × 100 / Duty Cycle) - 1 = (${finalCcrValue} × 100 / ${finalDutyCycle}) - 1 = ${formatNumber((finalCcrValue * 100 / finalDutyCycle), 3)} - 1 = ${finalArrValue}</p>`;
        resultHTML += `<p>• Tatsächlicher Duty Cycle = CCR × 100 / (ARR + 1) = ${finalCcrValue} × 100 / (${finalArrValue} + 1) = ${formatNumber(actualDuty, 3)}%</p>`;
    }
    
    // Calculate period duration if clock frequency and prescaler are provided
    if (clockFreq && prescaler && finalArrValue !== undefined) {
        const periodMs = (finalArrValue + 1) * parseInt(prescaler) / parseInt(clockFreq) * 1000;
        const freqHz = parseInt(clockFreq) / (parseInt(prescaler) * (finalArrValue + 1));
        
        resultHTML += `<p><strong>Periodendauer:</strong> ${formatNumber(periodMs)} ms</p>`;
        resultHTML += `<p><strong>PWM Frequenz:</strong> ${formatNumber(freqHz)} Hz</p>`;
        
        resultHTML += `<h4>Timing Rechenweg:</h4>`;
        resultHTML += `<p>• Periodendauer = (ARR + 1) × Prescaler / Clock Frequenz × 1000 = (${finalArrValue} + 1) × ${prescaler} / ${clockFreq} × 1000 = ${formatNumber(periodMs, 3)} ms</p>`;
        resultHTML += `<p>• PWM Frequenz = Clock Frequenz / (Prescaler × (ARR + 1)) = ${clockFreq} / (${prescaler} × (${finalArrValue} + 1)) = ${formatNumber(freqHz, 3)} Hz</p>`;
    }
    
    document.getElementById('pwm-result').innerHTML = resultHTML;
}

// 3. ADC Calculator
function calculateADC() {
    const bits = parseInt(document.getElementById('adc-bits').value);
    const vrefMv = parseFloat(document.getElementById('vref-mv').value);
    const digitalValue = document.getElementById('digital-value').value;
    const inputVoltage = document.getElementById('input-voltage').value;
    const actualMaxVoltage = document.getElementById('actual-max-voltage').value;
    
    if (!bits || !vrefMv) {
        document.getElementById('adc-result').innerHTML = '<p class="error">Bitte ADC Bits und Referenzspannung eingeben.</p>';
        return;
    }
    
    const maxDigital = Math.pow(2, bits) - 1;
    const lsbMv = vrefMv / Math.pow(2, bits);
    const fsrMv = maxDigital * lsbMv;
    const idealMaxCodeVoltage = (maxDigital - 0.5) * lsbMv; // Ideal voltage for max code (6.5 LSB for 3-bit)
    
    const quantErrorMv = lsbMv / 2;
    
    let resultHTML = `<h3>ADC Konfiguration</h3>`;
    resultHTML += `<p>ADC Auflösung: ${bits} bits</p>`;
    resultHTML += `<p>Referenzspannung: ${vrefMv} mV</p>`;
    resultHTML += `<p>Max Digitalwert: ${maxDigital}</p>`;
    resultHTML += `<p>LSB Auflösung: ${formatNumber(lsbMv, 3)} mV</p>`;
    resultHTML += `<p>Full Scale Range (FSR): ${formatNumber(fsrMv, 3)} mV (${formatNumber(fsrMv/1000, 3)} V)</p>`;
    resultHTML += `<p>Ideale Spannung für Max-Code (${maxDigital}): ${formatNumber(idealMaxCodeVoltage, 1)} mV (${formatNumber(idealMaxCodeVoltage/1000, 3)} V)</p>`;
    resultHTML += `<p>Quantisierungsfehler-Bereich: ±${formatNumber(quantErrorMv, 1)} mV (±${formatNumber(quantErrorMv/1000, 4)} V)</p>`;
    
    // Show calculation steps
    resultHTML += `<h4>Rechenweg:</h4>`;
    resultHTML += `<p>• LSB = Vref / 2^n = ${vrefMv} mV / 2^${bits} = ${vrefMv} / ${Math.pow(2, bits)} = ${formatNumber(lsbMv, 3)} mV</p>`;
    resultHTML += `<p>• Max Digital = 2^${bits} - 1 = ${Math.pow(2, bits)} - 1 = ${maxDigital}</p>`;
    resultHTML += `<p>• FSR = Max Digital × LSB = ${maxDigital} × ${formatNumber(lsbMv, 3)} = ${formatNumber(fsrMv, 3)} mV</p>`;
    resultHTML += `<p>• Ideale Spannung für Max-Code = (${maxDigital} - 0.5) × LSB = ${maxDigital - 0.5} × ${formatNumber(lsbMv, 3)} = ${formatNumber(idealMaxCodeVoltage, 1)} mV</p>`;
    resultHTML += `<p>• Quantisierungsfehler = ±LSB/2 = ±${formatNumber(lsbMv, 3)}/2 = ±${formatNumber(quantErrorMv, 1)} mV</p>`;
    
    // Gain Error Calculation
    if (actualMaxVoltage) {
        const actualMaxMv = parseFloat(actualMaxVoltage);
        const gainErrorMv = actualMaxMv - idealMaxCodeVoltage;
        const gainErrorLsb = gainErrorMv / lsbMv;
        const gainErrorPercent = (gainErrorMv / idealMaxCodeVoltage) * 100;
        
        resultHTML += `<h4>Gain Error Analyse:</h4>`;
        resultHTML += `<p>Tatsächliche Spannung bei Max-Code: ${actualMaxMv} mV (${formatNumber(actualMaxMv/1000, 3)} V)</p>`;
        resultHTML += `<p>Ideale Spannung bei Max-Code: ${formatNumber(idealMaxCodeVoltage, 1)} mV (${formatNumber(idealMaxCodeVoltage/1000, 3)} V)</p>`;
        resultHTML += `<p>Gain Error: ${formatNumber(gainErrorMv, 1)} mV (${formatNumber(gainErrorMv/1000, 3)} V)</p>`;
        resultHTML += `<p>Gain Error: ${formatNumber(gainErrorLsb, 2)} LSB</p>`;
        resultHTML += `<p>Gain Error: ${formatNumber(gainErrorPercent, 2)}%</p>`;
        
        resultHTML += `<h5>Gain Error Rechenweg:</h5>`;
        resultHTML += `<p>• Gain Error (mV) = Tatsächlich - Ideal = ${actualMaxMv} - ${formatNumber(idealMaxCodeVoltage, 1)} = ${formatNumber(gainErrorMv, 1)} mV</p>`;
        resultHTML += `<p>• Gain Error (LSB) = Gain Error (mV) / LSB = ${formatNumber(gainErrorMv, 1)} / ${formatNumber(lsbMv, 3)} = ${formatNumber(gainErrorLsb, 2)} LSB</p>`;
        resultHTML += `<p>• Gain Error (%) = (Gain Error / Ideal) × 100% = (${formatNumber(gainErrorMv, 1)} / ${formatNumber(idealMaxCodeVoltage, 1)}) × 100% = ${formatNumber(gainErrorPercent, 2)}%</p>`;
        
        if (gainErrorMv > 0) {
            resultHTML += `<p class="warning">Positiver Gain Error: ADC erreicht Max-Code zu früh</p>`;
        } else if (gainErrorMv < 0) {
            resultHTML += `<p class="warning">Negativer Gain Error: ADC erreicht Max-Code zu spät</p>`;
        } else {
            resultHTML += `<p class="success">Kein Gain Error vorhanden</p>`;
        }
    }
    
    if (digitalValue && !inputVoltage) {
        // Digital to voltage conversion
        const digital = parseInt(digitalValue);
        if (digital <= maxDigital) {
            const voltageMv = digital * lsbMv;
            resultHTML += `<h4>Konvertierungsergebnis:</h4>`;
            resultHTML += `<p>Digitalwert ${digital} → ${formatNumber(voltageMv, 3)} mV</p>`;
        } else {
            resultHTML += `<p class="error">Digitalwert ${digital} überschreitet Maximum (${maxDigital})</p>`;
        }
    } else if (inputVoltage && !digitalValue) {
        // Voltage to digital conversion
        const voltage = parseFloat(inputVoltage);
        if (voltage <= vrefMv) {
            const calculatedDigital = voltage / lsbMv;
            const roundedDigital = Math.round(calculatedDigital);
            const actualVoltage = roundedDigital * lsbMv;
            const errorMv = actualVoltage - voltage;
            
            resultHTML += `<h4>Konvertierungsergebnis:</h4>`;
            resultHTML += `<p>Eingangsspannung: ${voltage} mV</p>`;
            resultHTML += `<p>Berechneter Digitalwert: ${formatNumber(calculatedDigital, 6)} (exakt)</p>`;
            resultHTML += `<p>Gerundeter Digitalwert: ${roundedDigital}</p>`;
            resultHTML += `<p>Tatsächliche Ausgangsspannung: ${formatNumber(actualVoltage, 3)} mV</p>`;
            resultHTML += `<p>Quantisierungsfehler: ${formatNumber(errorMv, 3)} mV</p>`;
        } else {
            resultHTML += `<p class="error">Eingangsspannung ${voltage} mV überschreitet Referenzspannung ${vrefMv} mV</p>`;
        }
    } else if (digitalValue && inputVoltage) {
        // Verify both values
        const digital = parseInt(digitalValue);
        const voltage = parseFloat(inputVoltage);
        
        if (digital <= maxDigital && voltage <= vrefMv) {
            const voltageFromDigital = digital * lsbMv;
            const digitalFromVoltage = voltage / lsbMv;
            const roundedDigital = Math.round(digitalFromVoltage);
            
            resultHTML += `<h4>Konvertierungs-Verifikation:</h4>`;
            resultHTML += `<p>Gegebener Digitalwert: ${digital} → ${formatNumber(voltageFromDigital, 3)} mV</p>`;
            resultHTML += `<p>Gegebene Eingangsspannung: ${voltage} mV → Digitalwert: ${roundedDigital}</p>`;
            
            if (digital === roundedDigital) {
                resultHTML += `<p class="success">✓ Werte sind konsistent</p>`;
            } else {
                resultHTML += `<p class="warning">⚠ Werte sind inkonsistent - Erwarteter Digital: ${roundedDigital}</p>`;
            }
        } else {
            resultHTML += `<p class="error">Werte überschreiten ADC Grenzen</p>`;
        }
    } else {
        resultHTML += `<h4>Für Konvertierung bereitstellen:</h4>`;
        resultHTML += `<p>- Digitalwert (um Spannung zu erhalten)</p>`;
        resultHTML += `<p>- Eingangsspannung (um Digitalwert zu erhalten)</p>`;
        resultHTML += `<p>- Beide (zur Verifikation)</p>`;
    }
    
    document.getElementById('adc-result').innerHTML = resultHTML;
}

// 4. ADC Offset Error Calculator
function calculateADCOffset() {
    const bits = parseInt(document.getElementById('offset-adc-bits').value);
    const vrefMv = parseFloat(document.getElementById('offset-vref-mv').value);
    const idealDigital = document.getElementById('ideal-digital').value;
    const measuredDigital = document.getElementById('measured-digital').value;
    const inputVoltageMv = document.getElementById('offset-input-voltage').value;
    const offsetLsb = document.getElementById('offset-lsb').value;
    
    if (!bits || !vrefMv) {
        document.getElementById('adc-offset-result').innerHTML = '<p class="error">Bitte ADC Bits und Referenzspannung eingeben.</p>';
        return;
    }
    
    const maxDigital = Math.pow(2, bits) - 1;
    const lsbMv = vrefMv / Math.pow(2, bits);
    
    let resultHTML = `<h3>ADC Konfiguration</h3>`;
    resultHTML += `<p>Auflösung: ${bits} bits</p>`;
    resultHTML += `<p>Referenzspannung: ${vrefMv} mV</p>`;
    resultHTML += `<p>LSB Wert: ${formatNumber(lsbMv, 3)} mV</p>`;
    resultHTML += `<p>Max Digital: ${maxDigital}</p>`;
    
    if (idealDigital && measuredDigital && !offsetLsb) {
        // Calculate offset from ideal vs measured digital values
        const ideal = parseInt(idealDigital);
        const measured = parseInt(measuredDigital);
        const offsetDigital = measured - ideal;
        const offsetVoltageMv = offsetDigital * lsbMv;
        
        resultHTML += `<h4>Offset Fehler Berechnung:</h4>`;
        resultHTML += `<p>Idealer Digitalwert: ${ideal}</p>`;
        resultHTML += `<p>Gemessener Digitalwert: ${measured}</p>`;
        resultHTML += `<p>Offset Fehler (Digital): ${offsetDigital} LSB</p>`;
        resultHTML += `<p>Offset Fehler (Spannung): ${formatNumber(offsetVoltageMv, 3)} mV</p>`;
        
        resultHTML += `<h4>Offset Rechenweg:</h4>`;
        resultHTML += `<p>• Offset Fehler (Digital) = Gemessen - Ideal = ${measured} - ${ideal} = ${offsetDigital} LSB</p>`;
        resultHTML += `<p>• Offset Fehler (Spannung) = Offset × LSB = ${offsetDigital} × ${formatNumber(lsbMv, 3)} = ${formatNumber(offsetVoltageMv, 3)} mV</p>`;
        
        if (offsetDigital > 0) {
            resultHTML += `<p>Fehlertyp: Positiver Offset (ADC liest zu hoch)</p>`;
        } else if (offsetDigital < 0) {
            resultHTML += `<p>Fehlertyp: Negativer Offset (ADC liest zu niedrig)</p>`;
        } else {
            resultHTML += `<p>Fehlertyp: Kein Offset Fehler</p>`;
        }
        
    } else if (offsetLsb && measuredDigital) {
        // Calculate corrected values from known offset
        const offset = parseFloat(offsetLsb);
        const measured = parseInt(measuredDigital);
        const correctedDigital = measured - offset;
        const measuredVoltageMv = measured * lsbMv;
        const correctedVoltageMv = correctedDigital * lsbMv;
        const offsetVoltageMv = offset * lsbMv;
        
        resultHTML += `<h4>Offset Korrektur:</h4>`;
        resultHTML += `<p>Bekannter Offset: ${offset} LSB (${formatNumber(offsetVoltageMv, 3)} mV)</p>`;
        resultHTML += `<p>Gemessener Digital: ${measured}</p>`;
        resultHTML += `<p>Korrigierter Digital: ${formatNumber(correctedDigital)}</p>`;
        resultHTML += `<p>Gemessene Spannung: ${formatNumber(measuredVoltageMv, 3)} mV</p>`;
        resultHTML += `<p>Korrigierte Spannung: ${formatNumber(correctedVoltageMv, 3)} mV</p>`;
        
        resultHTML += `<h4>Korrektur Rechenweg:</h4>`;
        resultHTML += `<p>• Korrigierter Digital = Gemessen - Offset = ${measured} - ${offset} = ${formatNumber(correctedDigital, 3)}</p>`;
        resultHTML += `<p>• Gemessene Spannung = Gemessen × LSB = ${measured} × ${formatNumber(lsbMv, 3)} = ${formatNumber(measuredVoltageMv, 3)} mV</p>`;
        resultHTML += `<p>• Korrigierte Spannung = Korrigiert × LSB = ${formatNumber(correctedDigital, 3)} × ${formatNumber(lsbMv, 3)} = ${formatNumber(correctedVoltageMv, 3)} mV</p>`;
        
    } else if (inputVoltageMv && measuredDigital) {
        // Calculate offset from known input voltage and measured digital
        const inputVoltage = parseFloat(inputVoltageMv);
        const measured = parseInt(measuredDigital);
        const idealDigitalExact = inputVoltage / lsbMv;
        const idealDigitalRounded = Math.round(idealDigitalExact);
        const offsetDigital = measured - idealDigitalRounded;
        const offsetVoltageMv = offsetDigital * lsbMv;
        const measuredVoltageMv = measured * lsbMv;
        
        resultHTML += `<h4>Offset Fehler von bekannter Eingabe:</h4>`;
        resultHTML += `<p>Eingangsspannung: ${inputVoltage} mV</p>`;
        resultHTML += `<p>Erwarteter Digital: ${idealDigitalRounded} (exakt: ${formatNumber(idealDigitalExact, 6)})</p>`;
        resultHTML += `<p>Gemessener Digital: ${measured}</p>`;
        resultHTML += `<p>Gemessene Spannung: ${formatNumber(measuredVoltageMv, 3)} mV</p>`;
        resultHTML += `<p>Offset Fehler: ${offsetDigital} LSB (${formatNumber(offsetVoltageMv, 3)} mV)</p>`;
        
        resultHTML += `<h4>Offset aus Eingangsspannung Rechenweg:</h4>`;
        resultHTML += `<p>• Erwarteter Digital (exakt) = Eingangsspannung / LSB = ${inputVoltage} / ${formatNumber(lsbMv, 3)} = ${formatNumber(idealDigitalExact, 6)}</p>`;
        resultHTML += `<p>• Erwarteter Digital (gerundet) = ${idealDigitalRounded}</p>`;
        resultHTML += `<p>• Offset Fehler = Gemessen - Erwartet = ${measured} - ${idealDigitalRounded} = ${offsetDigital} LSB</p>`;
        resultHTML += `<p>• Offset Fehler (Spannung) = Offset × LSB = ${offsetDigital} × ${formatNumber(lsbMv, 3)} = ${formatNumber(offsetVoltageMv, 3)} mV</p>`;
        
        if (offsetDigital > 0) {
            resultHTML += `<p>Fehlertyp: Positiver Offset (ADC liest zu hoch)</p>`;
        } else if (offsetDigital < 0) {
            resultHTML += `<p>Fehlertyp: Negativer Offset (ADC liest zu niedrig)</p>`;
        } else {
            resultHTML += `<p>Fehlertyp: Kein Offset Fehler</p>`;
        }
        
    } else if (offsetLsb) {
        // Calculate offset voltage from LSB offset
        const offset = parseFloat(offsetLsb);
        const offsetVoltageMv = offset * lsbMv;
        
        resultHTML += `<h4>Offset Spannungsberechnung:</h4>`;
        resultHTML += `<p>Offset Fehler: ${offset} LSB</p>`;
        resultHTML += `<p>Offset Spannung: ${formatNumber(offsetVoltageMv, 3)} mV</p>`;
        
        if (offset > 0) {
            resultHTML += `<p>Fehlertyp: Positiver Offset (ADC liest zu hoch)</p>`;
        } else if (offset < 0) {
            resultHTML += `<p>Fehlertyp: Negativer Offset (ADC liest zu niedrig)</p>`;
        } else {
            resultHTML += `<p>Fehlertyp: Kein Offset Fehler</p>`;
        }
        
    } else {
        resultHTML += `<h4>Bitte eine der folgenden Kombinationen angeben:</h4>`;
        resultHTML += `<p>1. Idealer Digital + Gemessener Digital (um Offset zu berechnen)</p>`;
        resultHTML += `<p>2. Bekannter Offset in LSB + Gemessener Digital (um Werte zu korrigieren)</p>`;
        resultHTML += `<p>3. Eingangsspannung + Gemessener Digital (um Offset zu finden)</p>`;
        resultHTML += `<p>4. Offset in LSB allein (um Offset-Spannung zu erhalten)</p>`;
    }
    
    document.getElementById('adc-offset-result').innerHTML = resultHTML;
}

// 5. Find Optimal ADC Resolution
function findOptimalADC() {
    const vrefMv = parseFloat(document.getElementById('optimal-vref-mv').value);
    const targetLsb = parseFloat(document.getElementById('target-lsb').value);
    
    if (!vrefMv || !targetLsb) {
        document.getElementById('adc-optimal-result').innerHTML = '<p class="error">Bitte Referenzspannung und Ziel-LSB eingeben.</p>';
        return;
    }
    
    const requiredBits = Math.log2(vrefMv / targetLsb);
    
    let resultHTML = `<h3>Optimale ADC Auflösung finden</h3>`;
    resultHTML += `<p>Referenzspannung: ${vrefMv} mV</p>`;
    resultHTML += `<p>Ziel LSB: ${targetLsb} mV</p>`;
    resultHTML += `<p>Theoretisch benötigte Bits: ${formatNumber(requiredBits, 2)}</p>`;
    resultHTML += `<h4>Verfügbare ADC Optionen:</h4>`;
    
    const adcOptions = [8, 9, 10, 11, 12, 13, 14, 15, 16];
    
    adcOptions.forEach(bits => {
        const actualLsb = vrefMv / Math.pow(2, bits);
        const error = actualLsb - targetLsb;
        const errorPct = (error * 100) / targetLsb;
        
        const errorSign = error >= 0 ? '+' : '';
        resultHTML += `<p>${bits}-bit: LSB=${formatNumber(actualLsb, 3)}mV (${errorSign}${formatNumber(error, 3)}mV, ${errorSign}${formatNumber(errorPct, 1)}%)</p>`;
    });
    
    document.getElementById('adc-optimal-result').innerHTML = resultHTML;
}

// 6. Timer Problem Solver
function solveTimerProblem() {
    const bits = parseInt(document.getElementById('solver-timer-bits').value);
    const cntCurrent = parseInt(document.getElementById('current-cnt').value);
    const ccrValue = parseInt(document.getElementById('solver-ccr-value').value);
    const prescaler = parseInt(document.getElementById('solver-prescaler').value);
    const countDirection = document.getElementById('count-direction').value;
    const arrValueInput = document.getElementById('solver-arr-value').value;
    
    if (!bits || cntCurrent === '' || !ccrValue || !prescaler || !countDirection) {
        document.getElementById('timer-solver-result').innerHTML = '<p class="error">Bitte alle Pflichtfelder ausfüllen.</p>';
        return;
    }
    
    const maxCount = Math.pow(2, bits) - 1;
    const arrValue = arrValueInput ? parseInt(arrValueInput) : maxCount;
    
    let resultHTML = `<h3>Timer/Counter Problem Solver</h3>`;
    resultHTML += `<p>Timer Konfiguration:</p>`;
    resultHTML += `<p>- ${bits}-bit Timer (max: ${maxCount})</p>`;
    resultHTML += `<p>- Aktueller CNT: ${cntCurrent}</p>`;
    resultHTML += `<p>- CCR Wert: ${ccrValue}</p>`;
    resultHTML += `<p>- Prescaler: jeden ${prescaler}. Zyklus</p>`;
    resultHTML += `<p>- Richtung: ${countDirection === 'up' ? 'Up' : 'Down'}</p>`;
    resultHTML += `<p>- ARR Wert: ${arrValue}</p>`;
    
    let timerCycles = 0;
    let currentCnt = cntCurrent;
    const maxCycles = 100000; // Safety limit
    
    if (countDirection === 'down') {
        // Downcounter logic
        while (timerCycles < maxCycles) {
            if (currentCnt === ccrValue) {
                resultHTML += `<p class="success">Match gefunden! CNT=${currentCnt} entspricht CCR=${ccrValue}</p>`;
                break;
            }
            
            // Decrement counter
            if (currentCnt === 0) {
                currentCnt = arrValue; // Reload from ARR
                resultHTML += `<p>Counter neu geladen von ARR: ${arrValue}</p>`;
            } else {
                currentCnt--;
            }
            
            timerCycles++;
        }
    } else {
        // Upcounter logic
        while (timerCycles < maxCycles) {
            if (currentCnt === ccrValue) {
                resultHTML += `<p class="success">Match gefunden! CNT=${currentCnt} entspricht CCR=${ccrValue}</p>`;
                break;
            }
            
            // Increment counter
            if (currentCnt >= arrValue) {
                currentCnt = 0; // Reset to 0
                resultHTML += `<p>Counter zurückgesetzt auf 0</p>`;
            } else {
                currentCnt++;
            }
            
            timerCycles++;
        }
    }
    
    if (timerCycles >= maxCycles) {
        resultHTML += `<p class="error">Fehler: Zu viele Zyklen, überprüfen Sie Ihre Werte</p>`;
    } else {
        const clockCycles = timerCycles * prescaler;
        
        resultHTML += `<h4>Ergebnis:</h4>`;
        resultHTML += `<p>Timer Zyklen bis Match: ${timerCycles}</p>`;
        resultHTML += `<p>Tatsächliche Clock Zyklen: ${clockCycles}</p>`;
    }
    
    document.getElementById('timer-solver-result').innerHTML = resultHTML;
}

// 7. Endianness Converter
function convertEndianness() {
    const hexData = document.getElementById('hex-data').value.trim();
    const targetEndian = document.getElementById('target-endian').value;
    const dataWidth = document.getElementById('data-width').value;
    
    if (!hexData || !targetEndian) {
        document.getElementById('endian-result').innerHTML = '<p class="error">Bitte Hex-Daten und Ziel-Endianness eingeben.</p>';
        return;
    }
    
    // Remove 0x prefix and convert to uppercase
    let cleanHex = hexData.replace(/^0x/i, '').toUpperCase();
    
    // Ensure even number of hex digits
    if (cleanHex.length % 2 !== 0) {
        cleanHex = '0' + cleanHex;
    }
    
    // Pad with leading zeros if width is specified
    if (dataWidth) {
        const targetLength = parseInt(dataWidth) / 4; // Convert bits to hex digits
        while (cleanHex.length < targetLength) {
            cleanHex = '0' + cleanHex;
        }
    }
    
    // Convert endianness by reversing byte order
    let converted = '';
    for (let i = cleanHex.length; i > 0; i -= 2) {
        converted += cleanHex.substr(i - 2, 2);
    }
    
    let resultHTML = `<h3>Endianness Konverter</h3>`;
    resultHTML += `<p>Original Daten: 0x${cleanHex} (${cleanHex.length} Hex-Ziffern)</p>`;
    if (dataWidth) {
        resultHTML += `<p>Datenbreite: ${dataWidth} bits</p>`;
    }
    
    if (targetEndian === 'little') {
        resultHTML += `<h4>Little Endian Format:</h4>`;
        resultHTML += `<p>0x${converted}</p>`;
        resultHTML += `<h4>Big Endian Format:</h4>`;
        resultHTML += `<p>0x${cleanHex}</p>`;
    } else {
        resultHTML += `<h4>Big Endian Format:</h4>`;
        resultHTML += `<p>0x${converted}</p>`;
        resultHTML += `<h4>Little Endian Format:</h4>`;
        resultHTML += `<p>0x${cleanHex}</p>`;
    }
    
    // Show byte breakdown
    resultHTML += `<h4>Byte Aufschlüsselung:</h4>`;
    resultHTML += `<p>Original Bytes:</p>`;
    for (let i = 0; i < cleanHex.length; i += 2) {
        const byteNum = i / 2;
        const byteValue = cleanHex.substr(i, 2);
        const decValue = parseInt(byteValue, 16);
        resultHTML += `<p>  Byte ${byteNum}: 0x${byteValue} (dez: ${decValue})</p>`;
    }
    
    resultHTML += `<p>Konvertierte Bytes:</p>`;
    for (let i = 0; i < converted.length; i += 2) {
        const byteNum = i / 2;
        const byteValue = converted.substr(i, 2);
        const decValue = parseInt(byteValue, 16);
        resultHTML += `<p>  Byte ${byteNum}: 0x${byteValue} (dez: ${decValue})</p>`;
    }
    
    document.getElementById('endian-result').innerHTML = resultHTML;
}

// 8. Complete Timer PWM Problem Solver
function solveCompleteTimerPWM() {
    const clockFreq = parseFloat(document.getElementById('complete-clock-freq').value);
    const prescaler = parseInt(document.getElementById('complete-prescaler').value);
    const periodMs = parseFloat(document.getElementById('period-ms').value);
    const dutyFraction = document.getElementById('duty-fraction').value.trim();
    const timerBits = parseInt(document.getElementById('complete-timer-bits').value) || 16;
    const countDir = document.getElementById('complete-count-dir').value || 'down';
    
    if (!clockFreq || !prescaler || !periodMs || !dutyFraction) {
        document.getElementById('timer-pwm-result').innerHTML = '<p class="error">Bitte alle Pflichtfelder ausfüllen.</p>';
        return;
    }
    
    // Parse duty cycle (fraction or percentage)
    let dutyDecimal, dutyPercent;
    
    if (dutyFraction.includes('/')) {
        // Parse as fraction (e.g., "7/8")
        const fractionParts = dutyFraction.split('/');
        if (fractionParts.length !== 2) {
            document.getElementById('timer-pwm-result').innerHTML = '<p class="error">Duty Cycle als Bruch eingeben (z.B. 7/8) oder als Prozent (z.B. 87.5).</p>';
            return;
        }
        const numerator = parseInt(fractionParts[0]);
        const denominator = parseInt(fractionParts[1]);
        dutyDecimal = numerator / denominator;
        dutyPercent = dutyDecimal * 100;
    } else if (dutyFraction.includes('%')) {
        // Parse as percentage with % symbol (e.g., "87.5%")
        dutyPercent = parseFloat(dutyFraction.replace('%', ''));
        dutyDecimal = dutyPercent / 100;
    } else {
        // Parse as decimal percentage (e.g., "87.5")
        dutyPercent = parseFloat(dutyFraction);
        dutyDecimal = dutyPercent / 100;
    }
    
    if (isNaN(dutyDecimal) || dutyDecimal <= 0 || dutyDecimal > 1) {
        document.getElementById('timer-pwm-result').innerHTML = '<p class="error">Ungültiger Duty Cycle. Verwenden Sie Bruch (7/8) oder Prozent (87.5).</p>';
        return;
    }
    
    // Calculate effective frequency after prescaling
    const effFreq = clockFreq / prescaler;
    
    // Calculate period in seconds
    const periodS = periodMs / 1000;
    
    // Calculate required timer ticks for the period
    const timerTicks = Math.round(effFreq * periodS);
    const arrValue = timerTicks;
    
    // Check if ARR fits in timer resolution
    const maxCount = Math.pow(2, timerBits) - 1;
    
    let resultHTML = `<h3>Kompletter Timer PWM Problem Solver</h3>`;
    resultHTML += `<p>Gegebene Parameter:</p>`;
    resultHTML += `<p>- Clock Frequenz: ${clockFreq} Hz</p>`;
    resultHTML += `<p>- Prescaler: jeden ${prescaler}. Tick</p>`;
    resultHTML += `<p>- Gewünschte Periode: ${periodMs} ms</p>`;
    resultHTML += `<p>- Duty Cycle: ${dutyFraction}</p>`;
    resultHTML += `<p>- Timer Bits: ${timerBits}</p>`;
    resultHTML += `<p>- Zählrichtung: ${countDir === 'up' ? 'Up' : 'Down'}</p>`;
    
    resultHTML += `<p>Effektive Frequenz nach Prescaling: ${formatNumber(effFreq, 2)} Hz</p>`;
    resultHTML += `<p>Timer Ticks benötigt für ${periodMs}ms: ${timerTicks}</p>`;
    resultHTML += `<p>ARR Wert: ${arrValue}</p>`;
    
    if (arrValue > maxCount) {
        resultHTML += `<p class="warning">WARNUNG: ARR Wert (${arrValue}) überschreitet ${timerBits}-bit Timer Kapazität (${maxCount})</p>`;
    }
    
    resultHTML += `<p>Duty Cycle: ${formatNumber(dutyPercent, 2)}% (${dutyFraction})</p>`;
    
    resultHTML += `<h4>Timer PWM Rechenweg:</h4>`;
    resultHTML += `<p>• Effektive Frequenz = Clock Frequenz / Prescaler = ${clockFreq} / ${prescaler} = ${formatNumber(effFreq, 2)} Hz</p>`;
    resultHTML += `<p>• Periode in Sekunden = ${periodMs} ms / 1000 = ${formatNumber(periodS, 6)} s</p>`;
    resultHTML += `<p>• Timer Ticks für Periode = Effektive Frequenz × Periode = ${formatNumber(effFreq, 2)} × ${formatNumber(periodS, 6)} = ${formatNumber(effFreq * periodS, 2)}</p>`;
    resultHTML += `<p>• ARR Wert = Timer Ticks (gerundet) = ${timerTicks}</p>`;
    resultHTML += `<p>• Duty Cycle (dezimal) = ${formatNumber(dutyPercent, 2)}% / 100 = ${formatNumber(dutyDecimal, 4)}</p>`;
    
    // Calculate CCR value based on count direction and PWM logic
    let ccrValue;
    if (countDir === 'down') {
        // For downcounter: PWM high when CNT >= CCR, low when CNT < CCR
        // For duty_fraction high time: CCR = ARR * (1 - duty_fraction)
        const inverseDuty = 1 - dutyDecimal;
        ccrValue = Math.round(arrValue * inverseDuty);
    } else {
        // For upcounter: PWM high when CNT < CCR, low when CNT >= CCR
        ccrValue = Math.round(arrValue * dutyDecimal);
    }
    
    // CCR calculation steps
    if (countDir === 'down') {
        resultHTML += `<p>• CCR Berechnung (Downcounter): CCR = ARR × (1 - Duty Cycle) = ${arrValue} × (1 - ${formatNumber(dutyDecimal, 4)}) = ${arrValue} × ${formatNumber(1 - dutyDecimal, 4)} = ${formatNumber(arrValue * (1 - dutyDecimal), 2)} → ${ccrValue}</p>`;
    } else {
        resultHTML += `<p>• CCR Berechnung (Upcounter): CCR = ARR × Duty Cycle = ${arrValue} × ${formatNumber(dutyDecimal, 4)} = ${formatNumber(arrValue * dutyDecimal, 2)} → ${ccrValue}</p>`;
    }
    
    resultHTML += `<div class="solution">`;
    resultHTML += `<h4>LÖSUNG:</h4>`;
    resultHTML += `<p><strong>ARR Register Wert:</strong> ${arrValue} (${formatHex(arrValue)})</p>`;
    resultHTML += `<p><strong>CCR Register Wert:</strong> ${ccrValue} (${formatHex(ccrValue)})</p>`;
    resultHTML += `</div>`;
    
    // Verify the calculation
    const actualPeriod = (arrValue * prescaler / clockFreq) * 1000;
    let actualDuty;
    if (countDir === 'down') {
        actualDuty = (1 - ccrValue / arrValue) * 100;
    } else {
        actualDuty = (ccrValue / arrValue) * 100;
    }
    
    resultHTML += `<h4>Verifikation:</h4>`;
    resultHTML += `<p>Tatsächliche Periode: ${formatNumber(actualPeriod, 3)} ms</p>`;
    resultHTML += `<p>Tatsächlicher Duty Cycle: ${formatNumber(actualDuty, 2)}%</p>`;
    
    resultHTML += `<h5>Verifikations-Rechenweg:</h5>`;
    resultHTML += `<p>• Tatsächliche Periode = (ARR × Prescaler / Clock Frequenz) × 1000 = (${arrValue} × ${prescaler} / ${clockFreq}) × 1000 = ${formatNumber(actualPeriod, 3)} ms</p>`;
    if (countDir === 'down') {
        resultHTML += `<p>• Tatsächlicher Duty Cycle = (1 - CCR/ARR) × 100% = (1 - ${ccrValue}/${arrValue}) × 100% = ${formatNumber(actualDuty, 2)}%</p>`;
    } else {
        resultHTML += `<p>• Tatsächlicher Duty Cycle = (CCR/ARR) × 100% = (${ccrValue}/${arrValue}) × 100% = ${formatNumber(actualDuty, 2)}%</p>`;
    }
    
    document.getElementById('timer-pwm-result').innerHTML = resultHTML;
}

// 9. UART Parameters Calculator
function calculateUARTParams() {
    const dataBits = parseInt(document.getElementById('uart-data-bits').value) || 8;
    const stopBits = parseInt(document.getElementById('uart-stop-bits').value) || 1;
    const parity = document.getElementById('uart-parity').value || 'none';
    const baudRate = document.getElementById('uart-baud-rate').value;
    const byteRate = document.getElementById('uart-byte-rate').value;
    const overhead = document.getElementById('uart-overhead').value;
    
    // Calculate total bits per frame
    const parityBits = (parity === 'even' || parity === 'odd') ? 1 : 0;
    const startBits = 1; // Always 1 start bit in UART
    const totalFrameBits = startBits + dataBits + parityBits + stopBits;
    
    // Calculate efficiency
    const efficiency = dataBits / totalFrameBits;
    const efficiencyPercent = efficiency * 100;
    
    let resultHTML = `<h3>UART Parameter Rechner</h3>`;
    resultHTML += `<h4>Frame Struktur:</h4>`;
    resultHTML += `<p>- Start Bits: ${startBits}</p>`;
    resultHTML += `<p>- Daten Bits: ${dataBits}</p>`;
    resultHTML += `<p>- Paritäts Bits: ${parityBits} (${parity})</p>`;
    resultHTML += `<p>- Stopp Bits: ${stopBits}</p>`;
    resultHTML += `<p>- Gesamt Bits pro Frame: ${totalFrameBits}</p>`;
    resultHTML += `<p>- Frame Effizienz: ${formatNumber(efficiencyPercent, 2)}% (Daten/Gesamt)</p>`;
    
    resultHTML += `<h4>UART Frame Rechenweg:</h4>`;
    resultHTML += `<p>• Gesamt Frame Bits = Start + Daten + Parität + Stopp = ${startBits} + ${dataBits} + ${parityBits} + ${stopBits} = ${totalFrameBits} Bits</p>`;
    resultHTML += `<p>• Frame Effizienz = Daten Bits / Gesamt Bits × 100% = ${dataBits} / ${totalFrameBits} × 100% = ${formatNumber(efficiencyPercent, 2)}%</p>`;
    
    let calculatedBaudRate, calculatedByteRate;
    
    if (byteRate && !baudRate) {
        // Calculate baud rate from byte rate
        let effectiveByteRate = parseFloat(byteRate);
        if (overhead) {
            effectiveByteRate = effectiveByteRate / (1 - parseFloat(overhead));
            resultHTML += `<p>Angeforderte Byte Rate: ${byteRate} bytes/s</p>`;
            resultHTML += `<p>Overhead Verhältnis: ${formatNumber(parseFloat(overhead) * 100, 1)}%</p>`;
            resultHTML += `<p>Benötigte effektive Rate: ${formatNumber(effectiveByteRate, 6)} bytes/s</p>`;
        }
        
        calculatedBaudRate = Math.round(effectiveByteRate * totalFrameBits);
        resultHTML += `<p>Berechnete Baud Rate: ${calculatedBaudRate} baud</p>`;
        
        resultHTML += `<h4>Baud Rate aus Byte Rate Rechenweg:</h4>`;
        if (overhead) {
            resultHTML += `<p>• Effektive Byte Rate = Angeforderte Rate / (1 - Overhead) = ${byteRate} / (1 - ${overhead}) = ${formatNumber(effectiveByteRate, 6)} bytes/s</p>`;
        }
        resultHTML += `<p>• Baud Rate = Effektive Byte Rate × Frame Bits = ${formatNumber(effectiveByteRate, 6)} × ${totalFrameBits} = ${calculatedBaudRate} baud</p>`;
        
    } else if (baudRate && !byteRate) {
        // Calculate byte rate from baud rate
        calculatedBaudRate = parseInt(baudRate);
        const theoreticalByteRate = calculatedBaudRate / totalFrameBits;
        
        if (overhead) {
            calculatedByteRate = theoreticalByteRate * (1 - parseFloat(overhead));
            resultHTML += `<p>Theoretische Byte Rate: ${formatNumber(theoreticalByteRate, 6)} bytes/s</p>`;
            resultHTML += `<p>Overhead Verhältnis: ${formatNumber(parseFloat(overhead) * 100, 1)}%</p>`;
            resultHTML += `<p>Tatsächlich nutzbare Byte Rate: ${formatNumber(calculatedByteRate, 6)} bytes/s</p>`;
        } else {
            calculatedByteRate = theoreticalByteRate;
        }
        
        resultHTML += `<h4>Byte Rate aus Baud Rate Rechenweg:</h4>`;
        resultHTML += `<p>• Theoretische Byte Rate = Baud Rate / Frame Bits = ${calculatedBaudRate} / ${totalFrameBits} = ${formatNumber(theoreticalByteRate, 6)} bytes/s</p>`;
        if (overhead) {
            resultHTML += `<p>• Tatsächliche Byte Rate = Theoretische Rate × (1 - Overhead) = ${formatNumber(theoreticalByteRate, 6)} × (1 - ${overhead}) = ${formatNumber(calculatedByteRate, 6)} bytes/s</p>`;
        }
        
    } else if (baudRate && byteRate) {
        // Verify and calculate overhead
        calculatedBaudRate = parseInt(baudRate);
        calculatedByteRate = parseFloat(byteRate);
        
        const theoreticalByteRate = calculatedBaudRate / totalFrameBits;
        const actualOverheadRatio = 1 - (calculatedByteRate / theoreticalByteRate);
        
        resultHTML += `<h4>Parameter Verifikation:</h4>`;
        resultHTML += `<p>Gegebene Baud Rate: ${calculatedBaudRate} baud</p>`;
        resultHTML += `<p>Gegebene Byte Rate: ${calculatedByteRate} bytes/s</p>`;
        resultHTML += `<p>Theoretische max Byte Rate: ${formatNumber(theoreticalByteRate, 6)} bytes/s</p>`;
        resultHTML += `<p>Berechnetes Overhead Verhältnis: ${formatNumber(actualOverheadRatio * 100, 1)}%</p>`;
        
        if (overhead) {
            const expectedByteRate = theoreticalByteRate * (1 - parseFloat(overhead));
            resultHTML += `<p>Erwartete Byte Rate mit ${formatNumber(parseFloat(overhead) * 100, 1)}% Overhead: ${formatNumber(expectedByteRate, 6)} bytes/s</p>`;
        }
    } else {
        resultHTML += `<p class="error">Bitte entweder Baud Rate ODER Byte Rate eingeben (oder beide zur Verifikation)</p>`;
        document.getElementById('uart-result').innerHTML = resultHTML;
        return;
    }
    
    // Summary calculations
    resultHTML += `<div class="solution">`;
    resultHTML += `<h4>UART KONFIGURATION ZUSAMMENFASSUNG</h4>`;
    resultHTML += `<p>Frame Format: ${dataBits}${parity.charAt(0)}${stopBits} (Daten-Parität-Stopp)</p>`;
    resultHTML += `<p>Baud Rate: ${calculatedBaudRate || 'N/A'} baud</p>`;
    resultHTML += `<p>Bit Zeit: ${formatNumber(1000000 / (calculatedBaudRate || 1), 3)} μs</p>`;
    resultHTML += `<p>Frame Zeit: ${formatNumber(totalFrameBits * 1000000 / (calculatedBaudRate || 1), 3)} μs</p>`;
    resultHTML += `<p>Max Byte Rate: ${formatNumber((calculatedBaudRate || 1) / totalFrameBits, 2)} bytes/s</p>`;
    resultHTML += `<p>Effektive Byte Rate: ${formatNumber(calculatedByteRate || 0, 2)} bytes/s</p>`;
    resultHTML += `</div>`;
    
    document.getElementById('uart-result').innerHTML = resultHTML;
}

// 10. UART Timing Calculator
function calculateUARTTiming() {
    const baudRate = parseInt(document.getElementById('timing-baud-rate').value);
    const dataLengthBytes = parseInt(document.getElementById('data-length-bytes').value);
    const dataBits = parseInt(document.getElementById('timing-data-bits').value) || 8;
    const stopBits = parseInt(document.getElementById('timing-stop-bits').value) || 1;
    const parity = document.getElementById('timing-parity').value || 'none';
    
    if (!baudRate || !dataLengthBytes) {
        document.getElementById('uart-timing-result').innerHTML = '<p class="error">Bitte Baud Rate und Anzahl Bytes eingeben.</p>';
        return;
    }
    
    const parityBits = (parity === 'even' || parity === 'odd') ? 1 : 0;
    const totalFrameBits = 1 + dataBits + parityBits + stopBits;
    const bitTimeUs = 1000000 / baudRate;
    const frameTimeUs = totalFrameBits * bitTimeUs;
    const totalTimeUs = dataLengthBytes * frameTimeUs;
    const totalTimeMs = totalTimeUs / 1000;
    
    let resultHTML = `<h3>UART Übertragungszeit Rechner</h3>`;
    resultHTML += `<p>Konfiguration: ${dataBits}${parity.charAt(0)}${stopBits} bei ${baudRate} baud</p>`;
    resultHTML += `<p>Zu übertragende Daten: ${dataLengthBytes} bytes</p>`;
    resultHTML += `<h4>Timing Aufschlüsselung:</h4>`;
    resultHTML += `<p>- Bit Zeit: ${formatNumber(bitTimeUs, 3)} μs</p>`;
    resultHTML += `<p>- Frame Zeit: ${formatNumber(frameTimeUs, 3)} μs</p>`;
    resultHTML += `<p>- Gesamtübertragungszeit: ${formatNumber(totalTimeUs, 3)} μs (${formatNumber(totalTimeMs, 3)} ms)</p>`;
    resultHTML += `<p>- Effektive Datenrate: ${formatNumber(dataLengthBytes * 1000000 / totalTimeUs, 2)} bytes/s</p>`;
    
    resultHTML += `<h4>UART Timing Rechenweg:</h4>`;
    resultHTML += `<p>• Gesamt Frame Bits = 1 + ${dataBits} + ${parityBits} + ${stopBits} = ${totalFrameBits} Bits</p>`;
    resultHTML += `<p>• Bit Zeit = 1 / Baud Rate = 1 / ${baudRate} = ${formatNumber(bitTimeUs, 3)} μs</p>`;
    resultHTML += `<p>• Frame Zeit = Frame Bits × Bit Zeit = ${totalFrameBits} × ${formatNumber(bitTimeUs, 3)} = ${formatNumber(frameTimeUs, 3)} μs</p>`;
    resultHTML += `<p>• Gesamtzeit = Bytes × Frame Zeit = ${dataLengthBytes} × ${formatNumber(frameTimeUs, 3)} = ${formatNumber(totalTimeUs, 3)} μs</p>`;
    resultHTML += `<p>• Effektive Datenrate = Bytes × 1000000 / Gesamtzeit = ${dataLengthBytes} × 1000000 / ${formatNumber(totalTimeUs, 3)} = ${formatNumber(dataLengthBytes * 1000000 / totalTimeUs, 2)} bytes/s</p>`;
    
    document.getElementById('uart-timing-result').innerHTML = resultHTML;
}

// 11. Find Optimal UART Baud Rate
function findOptimalBaudRate() {
    const targetByteRate = parseFloat(document.getElementById('target-byte-rate').value);
    const dataBits = parseInt(document.getElementById('optimal-data-bits').value) || 8;
    const stopBits = parseInt(document.getElementById('optimal-stop-bits').value) || 1;
    const parity = document.getElementById('optimal-parity').value || 'none';
    const maxErrorPercent = parseFloat(document.getElementById('max-error-percent').value) || 5;
    
    if (!targetByteRate) {
        document.getElementById('uart-optimal-result').innerHTML = '<p class="error">Bitte Ziel Byte Rate eingeben.</p>';
        return;
    }
    
    const parityBits = (parity === 'even' || parity === 'odd') ? 1 : 0;
    const totalFrameBits = 1 + dataBits + parityBits + stopBits;
    const requiredBaud = Math.round(targetByteRate * totalFrameBits);
    
    let resultHTML = `<h3>Optimale UART Baud Rate Finder</h3>`;
    resultHTML += `<p>Ziel Byte Rate: ${targetByteRate} bytes/s</p>`;
    resultHTML += `<p>Frame Konfiguration: ${dataBits}${parity.charAt(0)}${stopBits} (${totalFrameBits} bits/frame)</p>`;
    resultHTML += `<p>Benötigte Baud Rate: ${requiredBaud} baud</p>`;
    
    resultHTML += `<h4>Optimale UART Rechenweg:</h4>`;
    resultHTML += `<p>• Gesamt Frame Bits = 1 + ${dataBits} + ${parityBits} + ${stopBits} = ${totalFrameBits} Bits</p>`;
    resultHTML += `<p>• Benötigte Baud Rate = Ziel Byte Rate × Frame Bits = ${targetByteRate} × ${totalFrameBits} = ${requiredBaud} baud</p>`;
    
    resultHTML += `<h4>Standard Baud Rate Optionen:</h4>`;
    
    const standardBauds = [300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 57600, 115200, 230400, 460800, 921600];
    
    standardBauds.forEach(baud => {
        const actualByteRate = baud / totalFrameBits;
        const error = actualByteRate - targetByteRate;
        const errorPercent = (error * 100) / targetByteRate;
        
        const absErrorPercent = Math.abs(errorPercent);
        const status = absErrorPercent <= maxErrorPercent ? '✓ GUT' : '  ';
        
        const errorSign = error >= 0 ? '+' : '';
        resultHTML += `<p>${status} ${baud.toString().padStart(6)} baud → ${formatNumber(actualByteRate, 2).padStart(8)} bytes/s (${errorSign}${formatNumber(errorPercent, 2)}%, ${errorSign}${formatNumber(error, 2)} bytes/s)</p>`;
    });
    
    resultHTML += `<p>✓ = Innerhalb ${maxErrorPercent}% des Ziels</p>`;
    
    document.getElementById('uart-optimal-result').innerHTML = resultHTML;
}

// 12. GPIO Configuration Calculator
function calculateGPIO() {
    const portLetter = document.getElementById('gpio-port').value.toUpperCase();
    const pinNumber = parseInt(document.getElementById('gpio-pin').value);
    const mode = document.getElementById('gpio-mode').value;
    const outputType = document.getElementById('gpio-output-type').value;
    const pullConfig = document.getElementById('gpio-pull').value;
    const speed = document.getElementById('gpio-speed').value;
    
    if (!portLetter || pinNumber === '' || !mode) {
        document.getElementById('gpio-result').innerHTML = '<p class="error">Bitte Port, Pin und Mode ausfüllen.</p>';
        return;
    }
    
    if (pinNumber < 0 || pinNumber > 15) {
        document.getElementById('gpio-result').innerHTML = '<p class="error">Pin Nummer muss zwischen 0-15 liegen.</p>';
        return;
    }
    
    // GPIO Base addresses for STM32F429
    const gpioBaseAddresses = {
        'A': 0x40020000,
        'B': 0x40020400,
        'C': 0x40020800,
        'D': 0x40020C00,
        'E': 0x40021000,
        'F': 0x40021400,
        'G': 0x40021800,
        'H': 0x40021C00,
        'I': 0x40022000,
        'J': 0x40022400,
        'K': 0x40022800
    };
    
    if (!gpioBaseAddresses[portLetter]) {
        document.getElementById('gpio-result').innerHTML = '<p class="error">Ungültiger Port. Verwenden Sie A-K.</p>';
        return;
    }
    
    const baseAddr = gpioBaseAddresses[portLetter];
    
    // Register offsets
    const registerOffsets = {
        'MODER': 0x00,
        'OTYPER': 0x04,
        'OSPEEDR': 0x08,
        'PUPDR': 0x0C,
        'IDR': 0x10,
        'ODR': 0x14,
        'BSRR': 0x18,
        'LCKR': 0x1C,
        'AFRL': 0x20,
        'AFRH': 0x24
    };
    
    // Mode values
    const modeValues = {
        'input': '00',
        'output': '01',
        'alternate': '10',
        'analog': '11'
    };
    
    // Output type values
    const outputTypeValues = {
        'push-pull': '0',
        'open-drain': '1'
    };
    
    // Pull configuration values
    const pullValues = {
        'none': '00',
        'pull-up': '01',
        'pull-down': '10'
    };
    
    // Speed values
    const speedValues = {
        'low': '00',
        'medium': '01',
        'fast': '10',
        'high': '11'
    };
    
    let resultHTML = `<h3>GPIO Port ${portLetter}.${pinNumber} Konfiguration</h3>`;
    resultHTML += `<p>Basis Adresse GPIO${portLetter}: ${formatHex(baseAddr)}</p>`;
    resultHTML += `<p>Konfiguration: ${mode}${outputType ? `, ${outputType}` : ''}${pullConfig ? `, ${pullConfig}` : ''}${speed ? `, ${speed} speed` : ''}</p>`;
    
    resultHTML += `<h4>Register Konfiguration:</h4>`;
    resultHTML += `<table class="gpio-table">`;
    resultHTML += `<tr><th>Register</th><th>Adresse</th><th>Bits</th><th>Position</th><th>Wert</th><th>Beschreibung</th></tr>`;
    
    // MODER Register
    const moderAddr = baseAddr + registerOffsets.MODER;
    const moderBitPos = `${pinNumber * 2 + 1}:${pinNumber * 2}`;
    const moderValue = modeValues[mode];
    resultHTML += `<tr><td>MODER</td><td>${formatHex(moderAddr)}</td><td>${moderValue}</td><td>${moderBitPos}</td><td>${moderValue}</td><td>${mode} mode</td></tr>`;
    
    // OTYPER Register (only for output mode)
    if (mode === 'output' && outputType) {
        const otyperAddr = baseAddr + registerOffsets.OTYPER;
        const otyperValue = outputTypeValues[outputType];
        resultHTML += `<tr><td>OTYPER</td><td>${formatHex(otyperAddr)}</td><td>${otyperValue}</td><td>${pinNumber}</td><td>${otyperValue}</td><td>${outputType}</td></tr>`;
    }
    
    // PUPDR Register (always shown)
    if (pullConfig) {
        const pupdrAddr = baseAddr + registerOffsets.PUPDR;
        const pupdrBitPos = `${pinNumber * 2 + 1}:${pinNumber * 2}`;
        const pupdrValue = pullValues[pullConfig];
        const pullDescription = pullConfig === 'none' ? 'no pull' : pullConfig;
        resultHTML += `<tr><td>PUPDR</td><td>${formatHex(pupdrAddr)}</td><td>${pupdrValue}</td><td>${pupdrBitPos}</td><td>${pupdrValue}</td><td>${pullDescription}</td></tr>`;
    }
    
    // OSPEEDR Register (only for output mode)
    if (mode === 'output' && speed) {
        const ospeedrAddr = baseAddr + registerOffsets.OSPEEDR;
        const ospeedrBitPos = `${pinNumber * 2 + 1}:${pinNumber * 2}`;
        const ospeedrValue = speedValues[speed];
        resultHTML += `<tr><td>OSPEEDR</td><td>${formatHex(ospeedrAddr)}</td><td>${ospeedrValue}</td><td>${ospeedrBitPos}</td><td>${ospeedrValue}</td><td>${speed} speed</td></tr>`;
    }
    
    resultHTML += `</table>`;
    
    // Generate C code
    resultHTML += `<h4>C Code Konfiguration:</h4>`;
    resultHTML += `<div class="code-block">`;
    resultHTML += `<pre>`;
    resultHTML += `// GPIO${portLetter} Pin ${pinNumber} Konfiguration\n`;
    resultHTML += `// ${mode}${outputType ? `, ${outputType}` : ''}${pullConfig ? `, ${pullConfig}` : ''}${speed ? `, ${speed} speed` : ''}\n\n`;
    
    // Calculate register values
    const moderMask = 0x3 << (pinNumber * 2);
    const moderSet = parseInt(moderValue, 2) << (pinNumber * 2);
    
    resultHTML += `// MODER Register\n`;
    resultHTML += `GPIO${portLetter}->MODER &= ~${formatHex(moderMask)};  // Clear bits\n`;
    resultHTML += `GPIO${portLetter}->MODER |= ${formatHex(moderSet)};   // Set ${mode} mode\n\n`;
    
    if (mode === 'output' && outputType) {
        const otyperMask = 0x1 << pinNumber;
        if (outputType === 'open-drain') {
            resultHTML += `// OTYPER Register\n`;
            resultHTML += `GPIO${portLetter}->OTYPER |= ${formatHex(otyperMask)};   // Set open-drain\n\n`;
        } else {
            resultHTML += `// OTYPER Register\n`;
            resultHTML += `GPIO${portLetter}->OTYPER &= ~${formatHex(otyperMask)};  // Set push-pull\n\n`;
        }
    }
    
    if (pullConfig) {
        const pupdrMask = 0x3 << (pinNumber * 2);
        const pupdrSet = parseInt(pullValues[pullConfig], 2) << (pinNumber * 2);
        const pullDescription = pullConfig === 'none' ? 'no pull' : pullConfig;
        resultHTML += `// PUPDR Register\n`;
        resultHTML += `GPIO${portLetter}->PUPDR &= ~${formatHex(pupdrMask)};  // Clear bits\n`;
        resultHTML += `GPIO${portLetter}->PUPDR |= ${formatHex(pupdrSet)};   // Set ${pullDescription}\n\n`;
    }
    
    if (mode === 'output' && speed) {
        const ospeedrMask = 0x3 << (pinNumber * 2);
        const ospeedrSet = parseInt(speedValues[speed], 2) << (pinNumber * 2);
        resultHTML += `// OSPEEDR Register\n`;
        resultHTML += `GPIO${portLetter}->OSPEEDR &= ~${formatHex(ospeedrMask)};  // Clear bits\n`;
        resultHTML += `GPIO${portLetter}->OSPEEDR |= ${formatHex(ospeedrSet)};   // Set ${speed} speed\n\n`;
    }
    
    resultHTML += `</pre>`;
    resultHTML += `</div>`;
    
    // Bit manipulation helper
    resultHTML += `<h4>Bit Manipulation Referenz:</h4>`;
    resultHTML += `<p>Pin ${pinNumber} Bitmuster:</p>`;
    resultHTML += `<p>- Einzelbit (OTYPER): Bit ${pinNumber}</p>`;
    resultHTML += `<p>- Doppelbit (MODER, PUPDR, OSPEEDR): Bits ${pinNumber * 2 + 1}:${pinNumber * 2}</p>`;
    
    document.getElementById('gpio-result').innerHTML = resultHTML;
}