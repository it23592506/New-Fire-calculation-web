import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const occupancyDefaults = {
  residential: { occupantLoad: 10 },
  office: { occupantLoad: 7 },
  retail: { occupantLoad: 3 },
  warehouse: { occupantLoad: 20 },
  assembly: { occupantLoad: 0.3 }
};

const calculateLocal = ({ occupancyType, floorArea, manualOccupants, exitCount, stairWidth, doorWidth }) => {
  const defaults = occupancyDefaults[occupancyType] || occupancyDefaults.office;
  const calcOccupants = manualOccupants > 0 ? manualOccupants : Math.ceil(floorArea / defaults.occupantLoad);
  const requiredExits = calcOccupants > 250 ? Math.ceil(calcOccupants / 250) : calcOccupants > 100 ? 2 : 1;
  const occupantsPerExit = Math.ceil(calcOccupants / exitCount);
  const minExitWidthM = occupantsPerExit * 0.005;
  const actualExitWidth = Math.max(minExitWidthM, doorWidth);
  const stairCapacity = Math.floor(stairWidth / 0.55);

  return {
    occupancyType,
    floorArea: Number(floorArea.toFixed(2)),
    occupantCount: Number(calcOccupants.toFixed(0)),
    exitCount: Number(exitCount.toFixed(0)),
    requiredExits: Number(requiredExits.toFixed(0)),
    occupantsPerExit: Number(occupantsPerExit.toFixed(0)),
    minExitWidthM: Number(minExitWidthM.toFixed(2)),
    actualExitWidth: Number(actualExitWidth.toFixed(2)),
    stairCapacity: Number(stairCapacity.toFixed(0)),
    adequacy: exitCount >= requiredExits ? "Adequate" : "Insufficient exits"
  };
};

export default function OccupantLoad() {
  const [occupancyType, setOccupancyType] = useState("office");
  const [floorArea, setFloorArea] = useState("1000");
  const [manualOccupants, setManualOccupants] = useState("");
  const [exitCount, setExitCount] = useState("2");
  const [stairWidth, setStairWidth] = useState("1.5");
  const [doorWidth, setDoorWidth] = useState("1.2");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);

    const area = toNumber(floorArea);
    const occupants = toNumber(manualOccupants || 0);
    const exits = toNumber(exitCount);
    const stairW = toNumber(stairWidth);
    const doorW = toNumber(doorWidth);

    if ([area, exits, stairW, doorW].some((v) => Number.isNaN(v))) {
      setError("Please enter valid numeric inputs");
      setLoading(false);
      return;
    }

    if (area <= 0 || exits <= 0 || stairW <= 0 || doorW <= 0) {
      setError("All dimensions must be positive");
      setLoading(false);
      return;
    }

    if (!Number.isNaN(occupants) && occupants < 0) {
      setError("Occupant override cannot be negative");
      setLoading(false);
      return;
    }

    const localResult = calculateLocal({
      occupancyType,
      floorArea: area,
      manualOccupants: occupants,
      exitCount: exits,
      stairWidth: stairW,
      doorWidth: doorW
    });

    setResult(localResult);

    try {
      if (!isAuthenticated()) {
        setNotice("Calculated locally. Sign in to save this report.");
        setLoading(false);
        return;
      }

      const res = await api.post("/calculate/custom", {
        calculatorType: "occupant_load",
        title: `Occupant Load (${occupancyType})`,
        occupancyType,
        floorArea: area,
        occupantCount: localResult.occupantCount,
        exitCount: exits,
        stairWidth: stairW,
        doorWidth: doorW
      });
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
        <h2>Occupant Load & Exit Width</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>
      <div className="card calc-section">
        <label className="field">
          Occupancy Type
          <select className="input" value={occupancyType} onChange={(e) => setOccupancyType(e.target.value)}>
            <option value="residential">Residential</option>
            <option value="office">Office</option>
            <option value="retail">Retail</option>
            <option value="warehouse">Warehouse</option>
            <option value="assembly">Assembly</option>
          </select>
        </label>
        <label className="field">
          Floor Area (m²)
          <input className="input" value={floorArea} onChange={(e) => setFloorArea(e.target.value)} />
        </label>
        <label className="field">
          Occupant Count (override)
          <input className="input" value={manualOccupants} onChange={(e) => setManualOccupants(e.target.value)} />
        </label>
        <label className="field">
          Number of Exits
          <input className="input" value={exitCount} onChange={(e) => setExitCount(e.target.value)} />
        </label>
        <label className="field">
          Stair Width (m)
          <input className="input" value={stairWidth} onChange={(e) => setStairWidth(e.target.value)} />
        </label>
        <label className="field">
          Door Width (m)
          <input className="input" value={doorWidth} onChange={(e) => setDoorWidth(e.target.value)} />
        </label>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}
        <button className="primary-btn" disabled={loading} onClick={calculate}>{loading ? "Calculating..." : "Calculate & Save Report"}</button>
        {result && (
          <div className="result-box">
            <p><strong>Occupants:</strong> {result.occupantCount}</p>
            <p><strong>Required Exits:</strong> {result.requiredExits}</p>
            <p><strong>Provided Exits:</strong> {result.exitCount}</p>
            <p><strong>Occupants per exit:</strong> {result.occupantsPerExit}</p>
            <p><strong>Min exit width (m):</strong> {result.minExitWidthM}</p>
            <p><strong>Actual exit width (m):</strong> {result.actualExitWidth}</p>
            <p><strong>Stair capacity (persons/min):</strong> {result.stairCapacity}</p>
            <p><strong>Status:</strong> {result.adequacy}</p>
          </div>
        )}
      </div>
    </div>
  );
}
