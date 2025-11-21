import Finland from "@react-map/finland";
const regionsInOrder = [
  "Lapland",
  "Northern Ostrobothnia",
  "Kainuu",
  "Central Ostrobothnia",
  "North Karelia",
  "Ostrobothnia",
  "Northern Savonia",
  "Southern Ostrobothnia",
  "Åland Islands",
  "Central Finland",
  "Satakunta",
  "Southern Savonia",
  "South Karelia",
  "Pirkanmaa",
  "Finland Proper",
  "Kymenlaakso",
  "Päijänne Tavastia",
  "Tavastia Proper",
  "Uusimaa",
];

const prices = regionsInOrder.reduce((acc, region, index) => {
  acc[region] = 1000 - index * 50;
  return acc;
}, {});

const incomePerRegion = { Uusimaa: 10 };

const getIncome = (region, multiplierOwned) =>
    (incomePerRegion[region] ?? 5) * (multiplierOwned ? 2 : 1);

const getColorByTier = (tier) => {
  const colors = [
    "#aed2f1", "#7cf4e5", "#19dcc6", "#4faef6", "#136312",
    "#00ffa1", "#8c00ff", "#FF1493", "#57ec00", "#ffca00"
  ];
  return colors[Math.min(tier - 1, colors.length - 1)];
};
const Game_map = ({
  gameState,
  handlePurchaseRegion,
  handleUpgradeRegion,
  income,
  multiplierCost,
  handlePlaneButtonClick, // Add the plane button handler as a prop
}) => {
  const { currency, ownedRegions, regionTiers, multiplierOwned } = gameState;

  const handleSelect = (region) => {
    if (!region) return;
    ownedRegions.has(region)
      ? handleUpgradeRegion(region)
      : handlePurchaseRegion(region, prices[region] || 1000);
  };

  return (
    <div style={{ display: "flex", gap: "20px", padding: "20px", height: "calc(100vh - 40px)", overflow: "hidden" }}>
      {/* Map Container */}
      <div style={{ flex: "1 1 50%", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        <button
          onClick={handlePlaneButtonClick}
          style={{
            marginBottom: "10px",
            padding: "10px 20px",
            backgroundColor: "#4caf50",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ✈️ Click me ✈️
        </button>
        <Finland
          type="select-single"
          size={280}
          cityColors={Object.fromEntries(
            regionsInOrder.map(region => [
              region,
              ownedRegions.has(region)
                ? getColorByTier(regionTiers[region] || 1)
                : "white"
            ]))
          }
          mapColor="#333333"
          style={{ border: "1px solid #555", maxWidth: "100%", height: "auto", borderRadius: "8px" }}
          onSelect={handleSelect}
        />
      </div>

      {/* Region List */}
      <div style={{ flex: "1 1 50%", minWidth: 300, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <h2 style={{ color: "#fff", position: "sticky", top: 0, background: "#2a2a2a", padding: "12px", margin: 0, zIndex: 2, borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
          💰 Total: €{currency} 💵{income}/s
        </h2>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0", marginRight: "8px" }}>
          {regionsInOrder.map(region => {
            const owned = ownedRegions.has(region);
            const tier = owned ? regionTiers[region] || 1 : 0;

            return (
              <div
                key={region}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  marginBottom: "6px",
                  background: owned ? getColorByTier(tier) : "#4a4a4a",
                  borderRadius: "6px",
                  color: owned ? "#000" : "#fff",
                  fontSize: "13px",
                  lineHeight: 1.3,
                }}
              >
                <img
                  src={`vaakunat/${region.replace(/\s+/g, "-")}.svg.png`}
                  alt=""
                  style={{
                    width: "28px",
                    height: "28px",
                    objectFit: "contain",
                    flexShrink: 0
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {region}
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <span>T{tier}</span>
                    <span>€{owned ? (tier + 1) * 500 : prices[region]}</span>
                    <span>€{getIncome(region, multiplierOwned) * tier}/s</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Game_map;
