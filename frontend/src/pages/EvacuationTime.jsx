import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const calculateLocal = ({
  detection,
  alarm,
  premove,
  distance,
  speed,
  aset,
  occupantCount,
  exitCount,
  exitWidthM,
  specificFlowPerMps,
  safetyFactorPercent
}) => {
  const travelTime = (distance / speed) / 60;
  const exitCapacityPps = exitCount * exitWidthM * specificFlowPerMps;
  const queuingTime = occupantCount > 0 ? (occupantCount / exitCapacityPps) / 60 : 0;
  const rset = detection + alarm + premove + travelTime + queuingTime;
  const rsetWithSafety = rset * (1 + safetyFactorPercent / 100);
  const margin = aset - rsetWithSafety;

  return {
    detection: Number(detection.toFixed(2)),
    alarm: Number(alarm.toFixed(2)),
    premove: Number(premove.toFixed(2)),
    travelTime: Number(travelTime.toFixed(2)),
    occupantCount: Number(occupantCount.toFixed(0)),
    exitCount: Number(exitCount.toFixed(0)),
    exitWidthM: Number(exitWidthM.toFixed(2)),
    specificFlowPerMps: Number(specificFlowPerMps.toFixed(2)),
    exitCapacityPps: Number(exitCapacityPps.toFixed(2)),
    queuingTime: Number(queuingTime.toFixed(2)),
    rset: Number(rset.toFixed(2)),
    safetyFactorPercent: Number(safetyFactorPercent.toFixed(1)),
    rsetWithSafety: Number(rsetWithSafety.toFixed(2)),
    aset: Number(aset.toFixed(2)),
    margin: Number(margin.toFixed(2)),
    status: margin >= 0 ? "Within ASET" : "Exceeds ASET"
  };
};

export default function EvacuationTime() {
  const [detectionTime, setDetectionTime] = useState("1.5");
  const [alarmTime, setAlarmTime] = useState("0.5");
  const [preMovementTime, setPreMovementTime] = useState("2");
  const [travelDistance, setTravelDistance] = useState("45");
  const [travelSpeed, setTravelSpeed] = useState("1.2");
  const [occupantCount, setOccupantCount] = useState("120");
  const [exitCount, setExitCount] = useState("2");
  const [exitWidthM, setExitWidthM] = useState("1.2");
  const [specificFlowPerMps, setSpecificFlowPerMps] = useState("1.3");
  const [safetyFactorPercent, setSafetyFactorPercent] = useState("10");
  const [asetTime, setAsetTime] = useState("10");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);

    const detection = toNumber(detectionTime);
    const alarm = toNumber(alarmTime);
    const premove = toNumber(preMovementTime);
    const distance = toNumber(travelDistance);
    const speed = toNumber(travelSpeed);
    const occupants = toNumber(occupantCount);
    const exits = toNumber(exitCount);
    const exitWidth = toNumber(exitWidthM);
    const specificFlow = toNumber(specificFlowPerMps);
    const safetyPercent = toNumber(safetyFactorPercent);
    const aset = toNumber(asetTime);

    if ([detection, alarm, premove, distance, speed, occupants, exits, exitWidth, specificFlow, safetyPercent, aset].some((value) => Number.isNaN(value))) {
      setError("Please enter valid numeric inputs");
      setLoading(false);
      return;
    }

    if (detection < 0 || alarm < 0 || premove < 0) {
      setError("Time inputs cannot be negative");
      setLoading(false);
      return;
    }

    if (distance <= 0 || speed <= 0 || exits <= 0 || exitWidth <= 0 || specificFlow <= 0 || aset <= 0) {
      setError("Distance, speed, exits, exit width, specific flow, and ASET must be positive");
      setLoading(false);
      return;
    }

    if (occupants < 0 || safetyPercent < 0) {
      setError("Occupants and safety factor cannot be negative");
      setLoading(false);
      return;
    }

    const localResult = calculateLocal({
      detection,
      alarm,
      premove,
      distance,
      speed,
      aset,
      occupantCount: occupants,
      exitCount: exits,
      exitWidthM: exitWidth,
      specificFlowPerMps: specificFlow,
      safetyFactorPercent: safetyPercent
    });

    setResult(localResult);

    try {
      if (!isAuthenticated()) {
        setNotice("Calculated locally. Sign in to save this report.");
        setLoading(false);
        return;
      }

      const res = await api.post("/calculate/custom", {
        calculatorType: "evacuation",
        title: "Evacuation Time Estimator",
        detectionTime: detection,
        alarmTime: alarm,
        preMovementTime: premove,
        travelDistance: distance,
        travelSpeed: speed,
        occupantCount: occupants,
        exitCount: exits,
        exitWidthM: exitWidth,
        specificFlowPerMps: specificFlow,
        safetyFactorPercent: safetyPercent,
        asetTime: aset
      });
      const data = res.data.metrics || res.data;
      setResult({
        ...localResult,
        detection: data.detectionTime ?? localResult.detection,
        alarm: data.alarmTime ?? localResult.alarm,
        premove: data.preMovementTime ?? localResult.premove,
        travelTime: data.travelTime ?? localResult.travelTime,
        exitCapacityPps: data.exitCapacityPps ?? localResult.exitCapacityPps,
        queuingTime: data.queuingTime ?? localResult.queuingTime,
        rset: data.rsetMinutes ?? localResult.rset,
        rsetWithSafety: data.rsetWithSafetyMinutes ?? localResult.rsetWithSafety,
        aset: data.asetMinutes ?? localResult.aset,
        margin: data.marginMinutes ?? localResult.margin,
        status: data.status || localResult.status
      });
    } catch (err) {
      setNotice(err.response?.data?.message || "Calculated locally, but saving failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page narrow">
      <div className="topbar compact">
        <h2>🚶 Evacuation Time</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>

      <div className="card calc-section">
        <h4>RSET vs ASET</h4>
        <label className="field">
          Detection Time (min)
          <input className="input" type="number" step="0.1" value={detectionTime} onChange={(e) => setDetectionTime(e.target.value)} placeholder="e.g. 1.5" />
        </label>
        <label className="field">
          Alarm Time (min)
          <input className="input" type="number" step="0.1" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} placeholder="e.g. 0.5" />
        </label>
        <label className="field">
          Pre-movement Time (min)
          <input className="input" type="number" step="0.1" value={preMovementTime} onChange={(e) => setPreMovementTime(e.target.value)} placeholder="e.g. 2" />
        </label>
        <label className="field">
          Travel Distance (m)
          <input className="input" type="number" step="1" value={travelDistance} onChange={(e) => setTravelDistance(e.target.value)} placeholder="e.g. 45" />
        </label>
        <label className="field">
          Travel Speed (m/s)
          <input className="input" type="number" step="0.1" value={travelSpeed} onChange={(e) => setTravelSpeed(e.target.value)} placeholder="e.g. 1.2" />
        </label>
        <label className="field">
          Occupant Count (persons)
          <input className="input" type="number" step="1" value={occupantCount} onChange={(e) => setOccupantCount(e.target.value)} placeholder="e.g. 120" />
        </label>
        <label className="field">
          Number of Available Exits
          <input className="input" type="number" step="1" value={exitCount} onChange={(e) => setExitCount(e.target.value)} placeholder="e.g. 2" />
        </label>
        <label className="field">
          Clear Exit Width per Exit (m)
          <input className="input" type="number" step="0.1" value={exitWidthM} onChange={(e) => setExitWidthM(e.target.value)} placeholder="e.g. 1.2" />
        </label>
        <label className="field">
          Specific Flow (persons/m/s)
          <input className="input" type="number" step="0.1" value={specificFlowPerMps} onChange={(e) => setSpecificFlowPerMps(e.target.value)} placeholder="e.g. 1.3" />
        </label>
        <label className="field">
          RSET Safety Factor (%)
          <input className="input" type="number" step="0.5" value={safetyFactorPercent} onChange={(e) => setSafetyFactorPercent(e.target.value)} placeholder="e.g. 10" />
        </label>
        <label className="field">
          Available Safe Egress Time (min)
          <input className="input" type="number" step="0.1" value={asetTime} onChange={(e) => setAsetTime(e.target.value)} placeholder="e.g. 10" />
        </label>
        <p className="muted">
          RSET combines detection, alarm, pre-movement, travel, and queueing time at exits, then applies safety factor.
        </p>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}

        <button className="primary-btn" disabled={loading} onClick={calculate}>
          {loading ? "Calculating..." : "Calculate & Save Report"}
        </button>

        {result && (
          <div className="result-box">
            <p><strong>Detection:</strong> {result.detection} min</p>
            <p><strong>Alarm:</strong> {result.alarm} min</p>
            <p><strong>Pre-movement:</strong> {result.premove} min</p>
            <p><strong>Travel Time:</strong> {result.travelTime} min</p>
            <p><strong>Exit Capacity:</strong> {result.exitCapacityPps} persons/s</p>
            <p><strong>Queueing Time:</strong> {result.queuingTime} min</p>
            <p><strong>RSET (base):</strong> {result.rset} min</p>
            <p><strong>RSET with Safety Factor:</strong> {result.rsetWithSafety} min</p>
            <p><strong>ASET:</strong> {result.aset} min</p>
            <p><strong>Margin (ASET - RSET adj):</strong> {result.margin} min</p>
            <p><strong>Status:</strong> {result.status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
