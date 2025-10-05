import { Card, Typography, Tag } from "antd";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ColorModeContext } from "../contexts/color-mode";

const { Text } = Typography;

interface CatCardProps {
  cat: any;
  calculateAge: (birthDate: string, record: any) => JSX.Element;
}

export const CatCard = ({ cat, calculateAge }: CatCardProps) => {
  const { mode } = useContext(ColorModeContext);
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (cat && cat.id) {
      navigate(`/cats/show/${cat.id}`);
    }
  };

  if (!cat) {
    return (
      <Card
        size="small"
        style={{
          backgroundColor: mode === "dark" ? "#141414" : "#f5f5f5",
          border: `1px solid ${mode === "dark" ? "#434343" : "#d9d9d9"}`,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        bodyStyle={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "12px",
        }}
      >
        <div>
          <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
            Unknown
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card
      size="small"
      hoverable={!!cat.id}
      onClick={handleCardClick}
      style={{
        backgroundColor: mode === "dark" ? "#141414" : "#f5f5f5",
        border: `1px solid ${mode === "dark" ? "#434343" : "#d9d9d9"}`,
        cursor: cat.id ? "pointer" : "default",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      bodyStyle={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "12px",
      }}
    >
      <div>
        <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
          {cat.name || "Unnamed"}
        </Text>
        <br />
        <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666", fontSize: "12px" }}>
          {cat.gender && `${cat.gender.charAt(0).toUpperCase() + cat.gender.slice(1)}`}
          {cat.status && ` • ${cat.status}`}
        </Text>
        <br />
        <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666", fontSize: "12px" }}>
          {calculateAge(cat.birth_date, cat)}
        </Text>
      </div>
      <div style={{ marginTop: "8px" }}>
        {cat.fur_color && cat.fur_color.length > 0 && (
          <Tag 
            color="blue" 
            style={{ fontSize: "10px", marginBottom: "4px" }}
          >
            {cat.fur_color.join(", ")}
          </Tag>
        )}
        {cat.fur_pattern && (
          <Tag 
            color="gold" 
            style={{ fontSize: "10px", marginBottom: "4px" }}
          >
            {cat.fur_pattern}
          </Tag>
        )}
      </div>
    </Card>
  );
};
