import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const QUIZ_HISTORY_KEY = "fire_quiz_history";

const quizDecks = [
  {
    id: "core",
    title: "Core Readiness",
    level: "Starter",
    durationMinutes: 10,
    blurb: "Fundamental safety knowledge for all staff before advanced tracks.",
    questions: [
      {
        prompt: "Which extinguisher is generally recommended for energized electrical equipment?",
        options: ["Water", "Foam", "Dry powder or CO2", "Wet chemical"],
        answer: 2,
        explanation: "Water and foam can conduct electricity, while CO2 and dry powder are safer options."
      },
      {
        prompt: "What is the first action when you discover a fire in a building?",
        options: ["Collect valuables", "Raise alarm and alert others", "Take the elevator", "Open all windows"],
        answer: 1,
        explanation: "Immediate alarm activation and warning occupants is the top priority."
      },
      {
        prompt: "PASS in extinguisher use means:",
        options: ["Point, Aim, Sweep, Stop", "Pull, Aim, Squeeze, Sweep", "Press, Alert, Spray, Shift", "Pull, Activate, Spray, Secure"],
        answer: 1,
        explanation: "PASS stands for Pull, Aim, Squeeze, Sweep."
      },
      {
        prompt: "Which smoke detector location is usually poor practice?",
        options: ["Outside sleeping areas", "In a hallway", "Directly above kitchen stove", "On every floor"],
        answer: 2,
        explanation: "Placing a detector right above a stove can cause nuisance alarms."
      },
      {
        prompt: "Best evacuation route behavior is to:",
        options: ["Use nearest safe stair exit", "Use elevator for speed", "Return for personal items", "Wait for smoke to clear"],
        answer: 0,
        explanation: "Evacuation should use designated safe stair exits."
      },
      {
        prompt: "A Class B fire mainly involves:",
        options: ["Metals", "Cooking oils", "Flammable liquids", "Ordinary solids"],
        answer: 2,
        explanation: "Class B is linked to flammable liquids such as fuel and solvents."
      },
      {
        prompt: "Which action helps prevent blocked exits?",
        options: ["Store boxes in corridors", "Weekly exit route checks", "Lock emergency doors", "Use exits as storage"],
        answer: 1,
        explanation: "Regular inspection keeps escape routes clear and usable."
      },
      {
        prompt: "Fire drills are mainly done to:",
        options: ["Test elevators", "Practice safe evacuation", "Check parking access", "Reduce insurance paperwork"],
        answer: 1,
        explanation: "Drills build fast, orderly evacuation behavior."
      },
      {
        prompt: "Before using an extinguisher, you should ensure:",
        options: ["No one is nearby", "Escape path is behind you", "Fire is already out", "Power is always on"],
        answer: 1,
        explanation: "A clear exit route is essential before attempting suppression."
      },
      {
        prompt: "Who should be notified after a fire incident?",
        options: ["Only social media", "No one", "Relevant emergency and site authorities", "Vendors only"],
        answer: 2,
        explanation: "Proper authority communication is mandatory for safety and reporting."
      }
    ]
  },
  {
    id: "engineering",
    title: "Engineering Concepts",
    level: "Intermediate",
    durationMinutes: 10,
    blurb: "Calculation thinking for hydrants, fire load, spacing, and risk interpretation.",
    questions: [
      {
        prompt: "Fire load density is commonly expressed as:",
        options: ["L/min", "kW", "MJ/m2", "Pa"],
        answer: 2,
        explanation: "Fire load density is typically measured in megajoules per square meter."
      },
      {
        prompt: "If area stays constant and combustible mass increases, fire load typically:",
        options: ["Decreases", "Stays unchanged", "Increases", "Becomes zero"],
        answer: 2,
        explanation: "More combustible mass per same area raises fire load."
      },
      {
        prompt: "A hydrant flow shortfall is best resolved first by:",
        options: ["Ignoring pressure losses", "Reviewing pipe and pump sizing", "Reducing all safety factors", "Removing branch isolation"],
        answer: 1,
        explanation: "Hydraulic review of pump and pipe sizing is the correct engineering step."
      },
      {
        prompt: "Detection spacing is mainly affected by:",
        options: ["Wall paint color", "Ceiling height and detector type", "Office furniture style", "Shift timing"],
        answer: 1,
        explanation: "Ceiling geometry and detector design are major spacing factors."
      },
      {
        prompt: "For most reports, a useful risk note combines:",
        options: ["Only photos", "Only equations", "Calculated value plus interpretation", "Only assumptions"],
        answer: 2,
        explanation: "Good reports combine computed outputs with practical meaning."
      },
      {
        prompt: "Increasing hose friction losses generally requires:",
        options: ["Lower pump head", "Higher pump head", "No pressure source", "Fewer isolation valves only"],
        answer: 1,
        explanation: "More losses require additional head to maintain required flow."
      },
      {
        prompt: "A safety factor in engineering design is used to:",
        options: ["Make equations harder", "Account for uncertainties", "Remove margins", "Avoid testing"],
        answer: 1,
        explanation: "Safety factors provide resilience against unknowns and variability."
      },
      {
        prompt: "A result trend chart is useful because it:",
        options: ["Replaces inspection", "Shows change over time", "Removes data", "Eliminates maintenance"],
        answer: 1,
        explanation: "Trend views help identify degrading performance and risk growth."
      },
      {
        prompt: "Hydrant residual pressure is checked to confirm:",
        options: ["Pipe color", "System can sustain flow", "Paint quality", "Alarm tone"],
        answer: 1,
        explanation: "Residual pressure indicates hydraulic adequacy under flow demand."
      },
      {
        prompt: "A poor assumption in calculations usually leads to:",
        options: ["Higher confidence", "Potentially wrong design output", "Automatic compliance", "No effect"],
        answer: 1,
        explanation: "Incorrect assumptions can invalidate engineering recommendations."
      }
    ]
  },
  {
    id: "incident",
    title: "Incident Decision Drill",
    level: "Advanced",
    durationMinutes: 10,
    blurb: "Scenario-based choices designed for team leads and response coordinators.",
    questions: [
      {
        prompt: "You smell smoke on level 2 with no visible flames. First leadership call?",
        options: ["Wait for visual confirmation", "Silence alarms to avoid panic", "Initiate investigation protocol and notify control", "Lock stair doors"],
        answer: 2,
        explanation: "Early controlled response with immediate communication prevents delay."
      },
      {
        prompt: "A stairwell is smoke-logged. Safest action is to:",
        options: ["Force everyone through quickly", "Use alternate protected route", "Use elevator", "Re-enter office floor"],
        answer: 1,
        explanation: "Use the alternate protected means of egress when one route is compromised."
      },
      {
        prompt: "During evacuation accounting, the most reliable method is:",
        options: ["Verbal estimate", "Attendance roster by zone marshal", "Social media check", "Security guess"],
        answer: 1,
        explanation: "Structured roster checks by assigned marshals give dependable accountability."
      },
      {
        prompt: "A small contained trash fire with trained staff present should be:",
        options: ["Approached with correct extinguisher and clear escape path", "Ignored", "Handled with water regardless of class", "Filmed for records first"],
        answer: 0,
        explanation: "Only attempt suppression if fire is small, conditions are safe, and route is clear."
      },
      {
        prompt: "Post-incident learning should include:",
        options: ["No documentation", "Root-cause note and corrective actions", "Only photos", "Delete all logs"],
        answer: 1,
        explanation: "Corrective action planning is central to continuous safety improvement."
      },
      {
        prompt: "If one team member is missing at assembly point, the best next step is:",
        options: ["Untrained re-entry search", "Immediate report to incident command with last-known location", "Dismiss count mismatch", "End evacuation"],
        answer: 1,
        explanation: "Incident command coordinates safe search decisions using verified information."
      },
      {
        prompt: "Best radio communication in an incident should be:",
        options: ["Long and unclear", "Short, clear, and confirmed", "Optional", "Only text message"],
        answer: 1,
        explanation: "Closed-loop concise communication reduces confusion during emergencies."
      },
      {
        prompt: "If fire growth is rapid, site teams should:",
        options: ["Continue manual attack always", "Prioritize evacuation and professional response", "Turn off alarms", "Split without command"],
        answer: 1,
        explanation: "Escalating incidents require evacuation and formal command structure."
      },
      {
        prompt: "What is a key objective of hot debriefs?",
        options: ["Assign blame", "Capture immediate lessons", "Delay all notes", "Ignore near misses"],
        answer: 1,
        explanation: "Quick debriefing preserves fresh insights for corrective action."
      },
      {
        prompt: "Who authorizes re-entry after evacuation?",
        options: ["Any employee", "Incident command or fire authority", "Visitors", "Security guard alone"],
        answer: 1,
        explanation: "Only authorized incident leaders should approve re-entry."
      }
    ]
  },
  {
    id: "extinguisher",
    title: "Extinguisher Mastery",
    level: "Starter",
    durationMinutes: 10,
    blurb: "Selection, placement, inspection, and safe use of extinguishers.",
    questions: [
      {
        prompt: "Which extinguisher is commonly used for cooking oil fires?",
        options: ["Class D", "Water", "Wet chemical", "CO2 only"],
        answer: 2,
        explanation: "Wet chemical units are designed for cooking oil and fat fires."
      },
      {
        prompt: "An extinguisher pin is removed at which step?",
        options: ["After spraying", "Before aiming", "After evacuation", "During storage"],
        answer: 1,
        explanation: "Pin removal is first so the handle can be operated."
      },
      {
        prompt: "Extinguishers should be mounted where they are:",
        options: ["Hidden", "Accessible and visible", "Locked in cabinets only", "Near heat sources"],
        answer: 1,
        explanation: "Quick access and visibility are critical in emergencies."
      },
      {
        prompt: "A damaged pressure gauge means the extinguisher is:",
        options: ["Ready", "Fine for later", "Needs service", "Optional"],
        answer: 2,
        explanation: "A damaged gauge indicates uncertain readiness and must be serviced."
      },
      {
        prompt: "Where should you aim an extinguisher stream?",
        options: ["Top of flames", "Base of fire", "Ceiling", "Nearest wall"],
        answer: 1,
        explanation: "Aiming at the fuel base is most effective for extinguishment."
      },
      {
        prompt: "Monthly extinguisher checks are mainly for:",
        options: ["Decoration", "Basic readiness verification", "Advertising", "Replacing alarms"],
        answer: 1,
        explanation: "Routine checks verify presence, access, and visible condition."
      },
      {
        prompt: "If fire is spreading fast, extinguisher use should:",
        options: ["Continue indefinitely", "Stop and evacuate", "Ignore alarm", "Block exits"],
        answer: 1,
        explanation: "Large or growing fire conditions require immediate evacuation."
      },
      {
        prompt: "Class D extinguishers are meant for:",
        options: ["Electrical panels", "Combustible metals", "Paper fires", "Gas leaks"],
        answer: 1,
        explanation: "Class D is specifically for reactive combustible metal fires."
      },
      {
        prompt: "An empty extinguisher after use should be:",
        options: ["Hung back", "Refilled or replaced promptly", "Ignored", "Stored in office"],
        answer: 1,
        explanation: "Used units must be recharged or replaced immediately."
      },
      {
        prompt: "Training on extinguisher use should be:",
        options: ["One time only", "Periodic and practical", "Optional for all", "Only online slides"],
        answer: 1,
        explanation: "Hands-on periodic refreshers improve correct usage during stress."
      }
    ]
  },
  {
    id: "evacuation",
    title: "Evacuation Protocol",
    level: "Starter",
    durationMinutes: 10,
    blurb: "Evacuation planning, route control, assembly, and accountability drills.",
    questions: [
      {
        prompt: "Primary evacuation maps should be placed:",
        options: ["Only in HR", "At visible route points", "In locked drawers", "Online only"],
        answer: 1,
        explanation: "Visible route maps help fast orientation in emergencies."
      },
      {
        prompt: "Assembly points should be:",
        options: ["Near hazard source", "Clear of building and access roads", "Inside parking basement", "Anywhere informal"],
        answer: 1,
        explanation: "Assembly areas must be safe and not obstruct responders."
      },
      {
        prompt: "A sweep warden's role includes:",
        options: ["Locking people in", "Checking assigned zone is cleared", "Turning off alarms", "Using lifts"],
        answer: 1,
        explanation: "Wardens verify area clearance and guide occupants out."
      },
      {
        prompt: "If your primary route is blocked by smoke:",
        options: ["Wait in place", "Use secondary route", "Use elevator", "Open all doors"],
        answer: 1,
        explanation: "Fallback routes are part of evacuation planning."
      },
      {
        prompt: "Re-entering a building before all-clear is:",
        options: ["Acceptable for quick retrieval", "Not allowed", "Required", "Best practice"],
        answer: 1,
        explanation: "No re-entry until authorized all-clear is issued."
      },
      {
        prompt: "Drill success is best measured by:",
        options: ["Noise level", "Evacuation time and accountability", "Poster quality", "Office attendance"],
        answer: 1,
        explanation: "Time and accountability are key performance metrics."
      },
      {
        prompt: "Visitors during evacuation should be:",
        options: ["Left behind", "Escorted by host/wardens", "Sent to cafeteria", "Ignored"],
        answer: 1,
        explanation: "Visitor management is part of emergency duty of care."
      },
      {
        prompt: "A frequent evacuation bottleneck is:",
        options: ["Clear signage", "Narrow blocked corridors", "Open stair doors", "Early alarm"],
        answer: 1,
        explanation: "Obstructed routes create dangerous delays and congestion."
      },
      {
        prompt: "Who confirms final headcount at assembly?",
        options: ["Any bystander", "Assigned marshals/team leaders", "Reception only", "None"],
        answer: 1,
        explanation: "Assigned leaders provide structured accountability checks."
      },
      {
        prompt: "Evacuation communication should prioritize:",
        options: ["Rumors", "Clear instructions", "Long speeches", "Silence"],
        answer: 1,
        explanation: "Simple, direct instructions improve movement and safety."
      }
    ]
  },
  {
    id: "detection",
    title: "Detection Systems",
    level: "Intermediate",
    durationMinutes: 10,
    blurb: "Detector principles, placement, testing, and alarm reliability.",
    questions: [
      {
        prompt: "Smoke detectors are generally best at detecting:",
        options: ["Floods", "Early combustion particles", "Gas pressure", "Ground faults"],
        answer: 1,
        explanation: "Smoke detectors identify combustion aerosols for early warning."
      },
      {
        prompt: "Heat detectors are often preferred where:",
        options: ["No dust exists", "Nuisance smoke may occur", "No ceiling", "No power"],
        answer: 1,
        explanation: "Heat detectors reduce nuisance alarms in certain harsh areas."
      },
      {
        prompt: "Detector testing frequency should follow:",
        options: ["Random choice", "Codes and manufacturer guidance", "Only user preference", "Never needed"],
        answer: 1,
        explanation: "Testing intervals come from standards and manufacturer requirements."
      },
      {
        prompt: "A false alarm trend should trigger:",
        options: ["No action", "Root-cause analysis and correction", "Alarm disable", "System removal"],
        answer: 1,
        explanation: "Repeated false alarms indicate design or maintenance issues."
      },
      {
        prompt: "Manual call points are installed to:",
        options: ["Decorate corridors", "Allow occupants to raise alarm", "Measure temperature", "Lock exits"],
        answer: 1,
        explanation: "Manual call points provide immediate human-triggered alarm activation."
      },
      {
        prompt: "Detector obstruction by decorations can:",
        options: ["Improve detection", "Delay alarm activation", "Lower sound only", "No effect"],
        answer: 1,
        explanation: "Blocked detector pathways can delay smoke or heat sensing."
      },
      {
        prompt: "Alarm audibility checks ensure:",
        options: ["Color consistency", "Occupants can hear warning", "Lower battery use", "More false alarms"],
        answer: 1,
        explanation: "Audibility verification confirms warnings are perceivable throughout spaces."
      },
      {
        prompt: "Detector zoning is useful because it:",
        options: ["Removes wiring", "Helps locate alarm origin", "Prevents maintenance", "Eliminates drills"],
        answer: 1,
        explanation: "Zones help responders quickly identify affected areas."
      },
      {
        prompt: "A detector dirty warning usually means:",
        options: ["System is perfect", "Cleaning/service is needed", "More sensitivity is better", "Ignore notice"],
        answer: 1,
        explanation: "Contamination affects sensing quality and should be serviced."
      },
      {
        prompt: "Alarm panel logs are valuable for:",
        options: ["Wallpaper design", "Incident and maintenance analysis", "Replacing drills", "Marketing"],
        answer: 1,
        explanation: "Logs provide traceability for faults, alarms, and interventions."
      }
    ]
  },
  {
    id: "hydrant",
    title: "Hydrant Hydraulics",
    level: "Intermediate",
    durationMinutes: 10,
    blurb: "Flow, pressure, pump head, and practical hydrant network checks.",
    questions: [
      {
        prompt: "Hydrant flow adequacy is verified by:",
        options: ["Visual paint check", "Flow and pressure testing", "Stair width", "Desk audit only"],
        answer: 1,
        explanation: "Hydraulic testing confirms real performance under demand."
      },
      {
        prompt: "If demand flow increases, required pump output typically:",
        options: ["Falls", "Rises", "Stays always fixed", "Becomes irrelevant"],
        answer: 1,
        explanation: "Higher demand generally needs more pump capacity or head."
      },
      {
        prompt: "Longer hose runs tend to:",
        options: ["Reduce friction loss", "Increase friction loss", "Remove pressure drop", "No hydraulic effect"],
        answer: 1,
        explanation: "Longer runs increase losses due to friction."
      },
      {
        prompt: "Residual pressure is measured while:",
        options: ["No water flows", "Water is flowing", "Pump is off always", "System isolated"],
        answer: 1,
        explanation: "Residual pressure is the pressure during active flow conditions."
      },
      {
        prompt: "Pump churn test is commonly used to:",
        options: ["Measure idle fuel", "Check no-flow pump condition", "Test extinguishers", "Inspect alarms"],
        answer: 1,
        explanation: "Churn checks pump performance at no-discharge condition."
      },
      {
        prompt: "Valve positions in hydrant systems should be:",
        options: ["Unknown", "Clearly marked and controlled", "Random", "Sealed forever"],
        answer: 1,
        explanation: "Known valve status avoids accidental isolation during emergency use."
      },
      {
        prompt: "Air trapped in lines can cause:",
        options: ["Better flow", "Flow instability", "Higher reliability", "No change"],
        answer: 1,
        explanation: "Entrained air can cause surging and inconsistent delivery."
      },
      {
        prompt: "Hydrant maintenance records should include:",
        options: ["Only date", "Test values and corrective actions", "Color preference", "Shift roster only"],
        answer: 1,
        explanation: "Records must capture performance data and actions taken."
      },
      {
        prompt: "Pressure gauges out of calibration can:",
        options: ["Improve accuracy", "Mislead engineering decisions", "Reduce flow loss", "Speed evacuation"],
        answer: 1,
        explanation: "Bad instruments produce unreliable hydraulic conclusions."
      },
      {
        prompt: "A hydrant network should be tested:",
        options: ["Only once at installation", "Periodically as per plan", "After incidents only", "Never if painted"],
        answer: 1,
        explanation: "Routine testing verifies ongoing readiness over time."
      }
    ]
  },
  {
    id: "fireload",
    title: "Fire Load Calculations",
    level: "Intermediate",
    durationMinutes: 10,
    blurb: "Practice estimating load density, occupancy risk, and reporting interpretation.",
    questions: [
      {
        prompt: "Fire load density increases when:",
        options: ["Combustibles decrease", "Combustibles increase in same area", "Area increases only", "Humidity rises"],
        answer: 1,
        explanation: "More fuel per unit area increases load density."
      },
      {
        prompt: "A high fire load area usually needs:",
        options: ["Less protection", "Enhanced controls and suppression", "No detectors", "Fewer drills"],
        answer: 1,
        explanation: "Higher fuel potential generally requires stronger protection strategy."
      },
      {
        prompt: "Compartmentation can reduce risk by:",
        options: ["Adding clutter", "Limiting fire spread", "Increasing fuel", "Blocking exits"],
        answer: 1,
        explanation: "Compartment boundaries help contain fire and smoke spread."
      },
      {
        prompt: "Material calorific value influences:",
        options: ["Number of drills", "Potential heat release", "Alarm color", "Hydrant signage"],
        answer: 1,
        explanation: "Calorific value determines potential energy contribution."
      },
      {
        prompt: "Storage arrangement affects fire load by:",
        options: ["No relation", "Changing fuel concentration and spread", "Only aesthetics", "Only weight"],
        answer: 1,
        explanation: "Arrangement impacts fuel continuity and fire development behavior."
      },
      {
        prompt: "Periodic reassessment is important when:",
        options: ["Nothing changes", "Use/occupancy changes", "Walls repainted", "No staff present"],
        answer: 1,
        explanation: "Operational changes can alter risk significantly."
      },
      {
        prompt: "Fire load data is useful for:",
        options: ["Only procurement", "Design and risk classification", "Payroll", "Vehicle routing"],
        answer: 1,
        explanation: "It supports engineering decisions and safety categorization."
      },
      {
        prompt: "Combustible housekeeping controls help by:",
        options: ["Increasing load", "Reducing available fuel", "Hiding hazards", "Replacing alarms"],
        answer: 1,
        explanation: "Better housekeeping lowers unnecessary fuel accumulation."
      },
      {
        prompt: "Documentation quality for fire load should be:",
        options: ["Minimal", "Traceable and auditable", "Verbal only", "Undated"],
        answer: 1,
        explanation: "Traceable records support repeatability and compliance review."
      },
      {
        prompt: "A risk matrix usually combines:",
        options: ["Location and color", "Likelihood and consequence", "Budget and weather", "Noise and lighting"],
        answer: 1,
        explanation: "Risk matrices classify hazards using likelihood and impact."
      }
    ]
  },
  {
    id: "electrical",
    title: "Electrical Fire Safety",
    level: "Advanced",
    durationMinutes: 10,
    blurb: "Electrical ignition risks, controls, lockout, and energized response behavior.",
    questions: [
      {
        prompt: "Overloaded circuits may lead to:",
        options: ["Lower heat", "Overheating and ignition risk", "No hazard", "Better efficiency"],
        answer: 1,
        explanation: "Excess current can overheat wiring and insulation."
      },
      {
        prompt: "Before maintenance on electrical panels, teams should:",
        options: ["Skip permits", "Apply lockout/tagout as required", "Spray water", "Work energized by default"],
        answer: 1,
        explanation: "Isolation controls are critical for safe electrical work."
      },
      {
        prompt: "Damaged cable insulation increases risk of:",
        options: ["Cooling", "Short circuits and sparks", "Lower voltage only", "No issue"],
        answer: 1,
        explanation: "Exposed conductors can arc and ignite nearby combustibles."
      },
      {
        prompt: "Portable heater misuse near paper stock can:",
        options: ["Reduce hazards", "Create ignition hazards", "Improve ventilation", "Disable alarms"],
        answer: 1,
        explanation: "High surface temperatures near fuels increase ignition probability."
      },
      {
        prompt: "Extension cords used as permanent wiring are:",
        options: ["Best practice", "Generally unsafe", "Mandatory", "Required by code"],
        answer: 1,
        explanation: "Temporary cords are not substitutes for permanent installations."
      },
      {
        prompt: "Arc flash protection planning focuses on:",
        options: ["Wall color", "Energy release and PPE boundaries", "HVAC balancing", "Furniture layout"],
        answer: 1,
        explanation: "Arc flash programs assess incident energy and worker protection."
      },
      {
        prompt: "If equipment emits burning odor, you should:",
        options: ["Ignore it", "Isolate power and report immediately", "Open all windows only", "Cover with cloth"],
        answer: 1,
        explanation: "Early isolation prevents escalation and enables safe inspection."
      },
      {
        prompt: "Electrical rooms should generally be:",
        options: ["Used for storage", "Kept clear and controlled", "Open for public access", "Used as pantry"],
        answer: 1,
        explanation: "Clear electrical spaces support safety and emergency access."
      },
      {
        prompt: "Thermal scanning in panels helps identify:",
        options: ["Paint defects", "Abnormal hot spots", "Alarm volume", "Pipe leaks"],
        answer: 1,
        explanation: "Infrared checks reveal loose connections and overload conditions."
      },
      {
        prompt: "Suitable extinguisher nearby energized equipment is usually:",
        options: ["Water only", "CO2 or dry powder", "Foam only", "Any random type"],
        answer: 1,
        explanation: "CO2 and dry powder are common options for electrical fire risk."
      }
    ]
  },
  {
    id: "industrial",
    title: "Industrial & Hazmat",
    level: "Advanced",
    durationMinutes: 10,
    blurb: "Process area hazards, chemical controls, and hot-work safety decisions.",
    questions: [
      {
        prompt: "Hot work should begin only after:",
        options: ["Any verbal approval", "Permit and area risk check", "Lunch break", "Shift change only"],
        answer: 1,
        explanation: "Permit controls verify mitigation before ignition sources are introduced."
      },
      {
        prompt: "Flammable liquid containers should be:",
        options: ["Unlabeled", "Properly labeled and closed", "Open for ventilation", "Stacked near heaters"],
        answer: 1,
        explanation: "Labeling and closure reduce misuse and vapor hazards."
      },
      {
        prompt: "Static electricity control in transfer operations may require:",
        options: ["No measures", "Bonding and grounding", "Water spray always", "More plastic wrapping"],
        answer: 1,
        explanation: "Bonding/grounding reduces static discharge ignition risk."
      },
      {
        prompt: "A chemical compatibility check is needed to avoid:",
        options: ["Low costs", "Dangerous reactions", "Fast reporting", "Routine cleaning"],
        answer: 1,
        explanation: "Incompatible storage can cause severe fire or release events."
      },
      {
        prompt: "Spill response kits should be:",
        options: ["Unavailable", "Accessible and matched to hazard", "Locked permanently", "Only for audits"],
        answer: 1,
        explanation: "Appropriate kits enable rapid containment of hazardous spills."
      },
      {
        prompt: "Combustible dust accumulation can:",
        options: ["Improve safety", "Create explosion risk", "Reduce ignition chance", "Protect equipment"],
        answer: 1,
        explanation: "Dust clouds and layers can ignite and propagate explosions."
      },
      {
        prompt: "Process shutdown procedures should be:",
        options: ["Unwritten", "Documented and trained", "Improvised", "Optional"],
        answer: 1,
        explanation: "Defined shutdown steps reduce incident escalation during emergencies."
      },
      {
        prompt: "Ventilation in solvent-use areas helps:",
        options: ["Increase vapor concentration", "Limit flammable vapor build-up", "Raise static", "Disable detectors"],
        answer: 1,
        explanation: "Ventilation lowers vapor concentration and ignition potential."
      },
      {
        prompt: "Emergency isolation switches should be:",
        options: ["Hidden", "Clearly marked and reachable", "Inside locked offices", "Removed when not used"],
        answer: 1,
        explanation: "Accessible emergency controls support rapid safe shutdown."
      },
      {
        prompt: "Near-miss reporting in industrial fire safety is:",
        options: ["Unimportant", "Critical for prevention", "Only legal formality", "Confidentially discouraged"],
        answer: 1,
        explanation: "Near misses reveal weak controls before serious incidents occur."
      }
    ]
  },
  {
    id: "command",
    title: "Incident Command",
    level: "Expert",
    durationMinutes: 10,
    blurb: "Leadership decisions, role clarity, and tactical communication under pressure.",
    questions: [
      {
        prompt: "The first command objective in most incidents is:",
        options: ["Asset recovery", "Life safety", "Media release", "Traffic control"],
        answer: 1,
        explanation: "Life safety is the primary objective in emergency response."
      },
      {
        prompt: "Span of control in command systems helps:",
        options: ["Increase confusion", "Keep supervision manageable", "Delay decisions", "Remove accountability"],
        answer: 1,
        explanation: "Balanced span improves clarity and effectiveness."
      },
      {
        prompt: "A staging area is primarily for:",
        options: ["Random parking", "Organized resource deployment", "Media interviews", "Public gathering"],
        answer: 1,
        explanation: "Staging centralizes and controls incoming resources."
      },
      {
        prompt: "Unified command is most useful when:",
        options: ["One agency only", "Multiple agencies share jurisdiction", "No incident exists", "Only drills"],
        answer: 1,
        explanation: "Unified command coordinates agencies with shared responsibility."
      },
      {
        prompt: "Incident action plans should include:",
        options: ["No objectives", "Objectives, tactics, and communications", "Only contact names", "Budget approval"],
        answer: 1,
        explanation: "Action plans align objectives with execution details."
      },
      {
        prompt: "Resource accountability means:",
        options: ["Unknown team locations", "Tracking personnel and equipment status", "No check-ins", "Informal assumptions"],
        answer: 1,
        explanation: "Accurate status tracking is vital for safety and efficiency."
      },
      {
        prompt: "Transfer of command should be:",
        options: ["Unannounced", "Briefed and documented", "Avoided always", "Handled by rumor"],
        answer: 1,
        explanation: "Formal transfer preserves continuity and shared situational awareness."
      },
      {
        prompt: "Operational periods in command planning help:",
        options: ["Eliminate planning", "Structure work in defined time blocks", "Delay objectives", "Avoid updates"],
        answer: 1,
        explanation: "Time-bounded planning supports rhythm and reassessment."
      },
      {
        prompt: "A command post should be:",
        options: ["Inside hazard zone", "Safe, identifiable, and functional", "Hidden from all", "Near active flames"],
        answer: 1,
        explanation: "Command locations need safety and communication functionality."
      },
      {
        prompt: "Demobilization planning is done:",
        options: ["Never", "As incident stabilizes", "Before alarm", "Only by finance"],
        answer: 1,
        explanation: "Structured demobilization ensures safe, efficient release of resources."
      }
    ]
  },
  {
    id: "compliance",
    title: "Code & Compliance",
    level: "Expert",
    durationMinutes: 10,
    blurb: "Documentation, audits, legal obligations, and evidence-based compliance habits.",
    questions: [
      {
        prompt: "Compliance audits primarily verify:",
        options: ["Interior design", "Conformance to required standards", "Personal opinions", "Marketing goals"],
        answer: 1,
        explanation: "Audits compare implementation against defined requirements."
      },
      {
        prompt: "If a critical deficiency is found, first action is:",
        options: ["Hide report", "Log and initiate corrective process", "Ignore until yearly review", "Delete records"],
        answer: 1,
        explanation: "Immediate documented corrective action is expected."
      },
      {
        prompt: "Training records should include:",
        options: ["No dates", "Participants, date, scope", "Only trainer name", "Only certificates"],
        answer: 1,
        explanation: "Complete records prove who was trained and on what topics."
      },
      {
        prompt: "Version-controlled procedures help by:",
        options: ["Causing confusion", "Ensuring current documents are used", "Removing approvals", "Avoiding updates"],
        answer: 1,
        explanation: "Controlled revisions prevent outdated process use."
      },
      {
        prompt: "Corrective actions should be:",
        options: ["Vague", "Assigned with due dates", "Optional", "Undocumented"],
        answer: 1,
        explanation: "Ownership and deadlines make closure measurable."
      },
      {
        prompt: "Inspection checklists are valuable because they:",
        options: ["Replace competence", "Standardize verification", "Reduce transparency", "Slow all work"],
        answer: 1,
        explanation: "Checklists improve consistency and reduce missed items."
      },
      {
        prompt: "Regulatory communication after serious incidents should be:",
        options: ["Delayed indefinitely", "Timely and accurate", "Unwritten", "Anonymous only"],
        answer: 1,
        explanation: "Regulations usually require timely factual reporting."
      },
      {
        prompt: "Evidence for closure of a finding may include:",
        options: ["Verbal promise", "Photos, records, and verification", "No proof", "Future intent only"],
        answer: 1,
        explanation: "Objective evidence demonstrates effective completion."
      },
      {
        prompt: "Internal audits should be treated as:",
        options: ["Punishment", "Improvement opportunities", "Optional ceremonies", "One-time events"],
        answer: 1,
        explanation: "Audit outcomes should drive preventive improvement."
      },
      {
        prompt: "Compliance culture is strongest when leadership:",
        options: ["Ignores findings", "Acts consistently on safety commitments", "Delegates blindly", "Hides metrics"],
        answer: 1,
        explanation: "Visible leadership follow-through builds trust and sustained compliance."
      }
    ]
  }
];

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function resultBand(scorePercent) {
  if (scorePercent >= 85) {
    return "Elite readiness";
  }
  if (scorePercent >= 70) {
    return "Strong performance";
  }
  if (scorePercent >= 50) {
    return "Developing";
  }
  return "Needs reinforcement";
}

export default function Quiz() {
  const [deckId, setDeckId] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [history, setHistory] = useState([]);

  const deck = useMemo(() => quizDecks.find((item) => item.id === deckId) || null, [deckId]);
  const questions = deck?.questions || [];
  const current = questions[index];
  const currentAnswer = answers[index];

  const answeredCount = Object.keys(answers).length;

  const score = useMemo(() => {
    if (!deck) {
      return 0;
    }
    return deck.questions.reduce((acc, question, i) => {
      if (answers[i] === question.answer) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [answers, deck]);

  const scorePercent = deck ? Math.round((score / deck.questions.length) * 100) : 0;
  const badges = useMemo(() => {
    const maxScore = history.reduce((best, row) => Math.max(best, row.scorePercent), 0);
    const attemptCount = history.length;
    return [
      maxScore >= 70 ? "Safety Bronze" : null,
      maxScore >= 85 ? "Safety Silver" : null,
      maxScore >= 95 ? "Safety Gold" : null,
      attemptCount >= 5 ? "Consistency Badge" : null
    ].filter(Boolean);
  }, [history]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUIZ_HISTORY_KEY);
      if (raw) {
        setHistory(JSON.parse(raw));
      }
    } catch (_error) {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!deck || submitted || secondsLeft <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [deck, submitted, secondsLeft]);

  function startDeck(selectedDeck) {
    setDeckId(selectedDeck.id);
    setIndex(0);
    setAnswers({});
    setSubmitted(false);
    setSecondsLeft(selectedDeck.durationMinutes * 60);
  }

  function chooseAnswer(optionIndex) {
    if (submitted) {
      return;
    }
    setAnswers((prev) => ({ ...prev, [index]: optionIndex }));
  }

  function submitQuiz() {
    setSubmitted(true);
    const nextHistory = [
      {
        id: `${deck?.id || "quiz"}-${Date.now()}`,
        deckTitle: deck?.title || "Quiz",
        scorePercent,
        submittedAt: new Date().toISOString()
      },
      ...history
    ].slice(0, 30);

    setHistory(nextHistory);
    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(nextHistory));
  }

  function resetDeck() {
    if (!deck) {
      return;
    }
    startDeck(deck);
  }

  return (
    <div className="page quiz-page">
      <div className="topbar compact">
        <div>
          <h2>Modern Quiz Arena</h2>
          <p className="muted">10 different quiz types, each with 10 questions, timer, scoring, and full review.</p>
        </div>
        <Link className="ghost-btn action-link" to="/home">
          Back Home
        </Link>
      </div>

      {!deck && (
        <>
          <section className="hero-banner card">
            <p className="muted">Quiz studio</p>
            <h2>Pick a quiz and validate knowledge under realistic pressure.</h2>
            <p>
              Each quiz includes 10 questions, a countdown timer, and instant diagnostics after
              submission.
            </p>
          </section>

          <section className="quiz-deck-grid">
            {quizDecks.map((item) => (
              <article key={item.id} className="quiz-deck-card">
                <p className="quiz-deck-level">{item.level}</p>
                <h3>{item.title}</h3>
                <p className="muted">{item.blurb}</p>
                <div className="quiz-deck-meta">
                  <span>Questions: {item.questions.length}</span>
                  <span>Time: {item.durationMinutes} min</span>
                </div>
                <button className="primary-btn" type="button" onClick={() => startDeck(item)}>
                  Start Quiz
                </button>
              </article>
            ))}
          </section>
        </>
      )}

      {deck && (
        <>
          <section className="quiz-runner card">
            <div className="quiz-runner-head">
              <div>
                <p className="quiz-chip">{deck.level}</p>
                <h3>{deck.title}</h3>
              </div>
              <div className="quiz-timer">{formatTime(secondsLeft)}</div>
            </div>

            <div className="quiz-progress-wrap">
              <div className="quiz-progress-track">
                <div
                  className="quiz-progress-fill"
                  style={{ width: `${Math.round((answeredCount / questions.length) * 100)}%` }}
                />
              </div>
              <p className="muted">
                Answered {answeredCount}/{questions.length}
              </p>
            </div>

            {!submitted && current && (
              <div className="quiz-question-card">
                <p className="quiz-q-number">
                  Question {index + 1} of {questions.length}
                </p>
                <h4>{current.prompt}</h4>

                <div className="quiz-options-grid">
                  {current.options.map((option, optionIndex) => (
                    <button
                      key={option}
                      type="button"
                      className={`quiz-option-btn ${currentAnswer === optionIndex ? "selected" : ""}`}
                      onClick={() => chooseAnswer(optionIndex)}
                    >
                      <span>{String.fromCharCode(65 + optionIndex)}</span>
                      {option}
                    </button>
                  ))}
                </div>

                <div className="actions">
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
                    disabled={index === 0}
                  >
                    Previous
                  </button>

                  {index < questions.length - 1 && (
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() => setIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    >
                      Next
                    </button>
                  )}

                  {index === questions.length - 1 && (
                    <button className="primary-btn" type="button" onClick={submitQuiz}>
                      Submit Quiz
                    </button>
                  )}
                </div>
              </div>
            )}

            {submitted && (
              <div className="quiz-result-panel">
                <h4>
                  {resultBand(scorePercent)}: {score}/{questions.length} ({scorePercent}%)
                </h4>
                <p className="muted">
                  Review every answer below, then retry this track or switch to another difficulty level.
                </p>

                <div className="quiz-review-list">
                  {questions.map((question, questionIndex) => {
                    const selected = answers[questionIndex];
                    const isCorrect = selected === question.answer;
                    return (
                      <article
                        key={question.prompt}
                        className={`quiz-review-item ${isCorrect ? "ok" : "miss"}`}
                      >
                        <p className="quiz-q-number">Q{questionIndex + 1}</p>
                        <p>{question.prompt}</p>
                        <p>
                          Your answer: {selected === undefined ? "Not answered" : question.options[selected]}
                        </p>
                        <p>Correct answer: {question.options[question.answer]}</p>
                        <p className="muted">Why: {question.explanation}</p>
                      </article>
                    );
                  })}
                </div>

                <div className="actions">
                  <button className="primary-btn" type="button" onClick={resetDeck}>
                    Retry This Quiz
                  </button>
                  <button className="ghost-btn" type="button" onClick={() => setDeckId(null)}>
                    Choose Another Quiz
                  </button>
                  <Link className="ghost-btn action-link" to="/education">
                    Open Education
                  </Link>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => {
                      const payload = {
                        learner: "Fire Safety User",
                        quiz: deck.title,
                        score: `${scorePercent}%`,
                        issuedAt: new Date().toISOString(),
                        status: resultBand(scorePercent)
                      };
                      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const anchor = document.createElement("a");
                      anchor.href = url;
                      anchor.download = `quiz-certificate-${deck.id}.json`;
                      anchor.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download Certificate
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="card">
            <h3>Badge-Based Learning</h3>
            <p className="muted">Earn badges by improving scores and completing repeated attempts.</p>
            <p><strong>Earned badges:</strong> {badges.length ? badges.join(", ") : "No badges yet"}</p>
            <h4>Recent attempts</h4>
            {history.length === 0 ? (
              <p className="muted">No attempts recorded yet.</p>
            ) : (
              <ul className="result-list">
                {history.slice(0, 5).map((entry) => (
                  <li key={entry.id}>
                    {entry.deckTitle}: {entry.scorePercent}% ({new Date(entry.submittedAt).toLocaleString()})
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}