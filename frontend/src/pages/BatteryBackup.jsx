import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const calculateLocal = ({ detectorCount, alarmPowerW, standbyHours, alarmHours, voltageV, safetyFactor }) => {
  const detectorPowerW = detectorCount * 0.5;
  const standbyPowerW = detectorPowerW + (alarmPowerW * 0.1);
  const standbyWH = standbyPowerW * standbyHours;
  const alarmWH = (detectorPowerW + alarmPowerW) * alarmHours;
  const totalWH = standbyWH + alarmWH;
  const withSafetyWH = totalWH * safetyFactor;
  const batteryAH = withSafetyWH / voltageV;
  const batteryCount = Math.ceil(batteryAH / 60);
  return {
    detectorCount,
    alarmPowerW,
    standbyHours,
    alarmHours,
    standbyWH: Number(standbyWH.toFixed(0)),
    alarmWH: Number(alarmWH.toFixed(0)),
    totalWH: Number(totalWH.toFixed(0)),
    withSafetyWH: Number(withSafetyWH.toFixed(0)),
    voltageV,
    requiredAH: Number(batteryAH.toFixed(1)),
    standardBatteryCount: batteryCount
  };
};

export default function BatteryBackup() {
  const [detectorCount, setDetectorCount] = useState("50");
  const [alarmPowerW, setAlarmPowerW] = useState("100");
  const [standbyHours, setStandbyHours] = useState("24");
  const [alarmHours, setAlarmHours] = useState("0.5");
  const [voltageV, setVoltageV] = useState("24");
  const [safetyFactor, setSafetyFactor] = useState("1.25");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    const detectors = toNumber(detectorCount);
    const alarmP = toNumber(alarmPowerW);
    const standby = toNumber(standbyHours);
    const alarmH = toNumber(alarmHours);
    const voltage = toNumber(voltageV);
    const safety = toNumber(safetyFactor);
    if ([detectors, alarmP, standby, alarmH, voltage, safety].some((v) => Number.isNaN(v))) {
      setError("Please enter valid numeric inputs");
      setLoading(false);
      return;
    }
    const localResult = calculateLocal({ detectorCount: detectors, alarmPowerW: alarmP, standbyHours: standby, alarmHours: alarmH, voltageV: voltage, safetyFactor: safety });
    setResult(localResult);
    try {
      if (!isAuthenticated()) {
        setNotice("Calculated locally. Sign in to save this report.");
        setLoading(false);
        return;
      }
      const res = await api.post("/calculate/custom", { calculatorType: "battery_backup", title: "Battery Backup", detectorCount: detectors, alarmPowerW: alarmP, standbyHours: standby, alarmHours: alarmH, voltageV: voltage, safetyFactor: safety });
      const data = res.data.metrics || res.data;
      setResult({ ...localResult, ...data });
    } catch (err) {
      setNotice(err.response?.data?.message || "Calculated locally, but saving failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page narrow">
      <div className="topbar compact">
        <h2>Battery Backup Sizing</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>
      <div className="card calc-section">
        <label className="field">Detector Count<input className="input" value={detectorCount} onChange={(e)=>setDetectorCount(e.target.value)} /></label>
        <label className="field">Alarm Power (W)<input className="input" value={alarmPowerW} onChange={(e)=>setAlarmPowerW(e.target.value)} /></label>
        <label className="field">Standby Hours<input className="input" value={standbyHours} onChange={(e)=>setStandbyHours(e.target.value)} /></label>
        <label className="field">Alarm Hours<input className="input" value={alarmHours} onChange={(e)=>setAlarmHours(e.target.value)} /></label>
        <label className="field">System Voltage (V)<input className="input" value={voltageV} onChange={(e)=>setVoltageV(e.target.value)} /></label>
        <label className="field">Safety Factor<input className="input" value={safetyFactor} onChange={(e)=>setSafetyFactor(e.target.value)} /></label>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}
        <button className="primary-btn" disabled={loading} onClick={calculate}>{loading ? "Calculating..." : "Calculate & Save Report"}</button>
        {result && (
          <div className="result-box">
            <p><strong>Required AH:</strong> {result.requiredAH} AH</p>
            <p><strong>Standard Battery Count (60Ah):</strong> {result.standardBatteryCount}</p>
            <p><strong>Total Energy (Wh):</strong> {result.withSafetyWH}</p>
          </div>
        )}
      </div>
    </div>
  );
}
