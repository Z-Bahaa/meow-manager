import { Show, EditButton, DeleteButton, useNotificationProvider } from "@refinedev/antd";
import { useShow, useList } from "@refinedev/core";
import { Typography, Space, Button, Card, Row, Col, Tag, Divider } from "antd";
import { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";

const { Title, Text } = Typography;

export const LitterShow = () => {
  const { mode } = useContext(ColorModeContext);
  const { open } = useNotificationProvider();
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;

  // Fetch all cats for parent names
  const { data: allCatsData } = useList({
    resource: "cats",
    pagination: {
      mode: "off", // Get all cats without pagination
    },
  });

  // Create a map for quick cat lookup
  const catsMap = new Map();
  allCatsData?.data?.forEach((cat: any) => {
    catsMap.set(cat.id, cat);
  });

  const litterData = data?.data;

  // Get parent names
  const motherName = litterData?.mother_id ? 
    (catsMap.get(litterData.mother_id)?.name || `Cat #${litterData.mother_id}`) : 
    "Unknown";
  
  const fatherName = litterData?.father_id ? 
    (catsMap.get(litterData.father_id)?.name || `Cat #${litterData.father_id}`) : 
    "Unknown";

  return (
    <Show
      isLoading={isLoading}
      headerButtons={
        <Space>
          <EditButton />
          <DeleteButton />
        </Space>
      }
    >
      <Card
        style={{
          backgroundColor: mode === "dark" ? "#1f1f1f" : "#ffffff",
          border: `1px solid ${mode === "dark" ? "#434343" : "#d9d9d9"}`,
        }}
      >
        <Row gutter={[24, 24]}>
          {/* Basic Information */}
          <Col span={24}>
            <Title level={3} style={{ 
              color: mode === "dark" ? "#ffffff" : "#000000",
              marginBottom: "16px"
            }}>
              Litter Information
            </Title>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Litter ID:
                  </Text>
                  <br />
                  <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666" }}>
                    #{litterData?.id}
                  </Text>
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={8}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Name:
                  </Text>
                  <br />
                  <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666" }}>
                    {litterData?.name || "Unknown"}
                  </Text>
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={8}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Birth Date:
                  </Text>
                  <br />
                  <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666" }}>
                    {litterData?.birth_date ? 
                      new Date(litterData.birth_date).toLocaleDateString() : 
                      "Unknown"
                    }
                  </Text>
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={8}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Size:
                  </Text>
                  <br />
                  <Tag 
                    color="blue" 
                    style={{ 
                      fontSize: "14px",
                      padding: "4px 8px"
                    }}
                  >
                    {litterData?.size || "Unknown"}
                  </Tag>
                </div>
              </Col>
            </Row>
          </Col>

          <Divider style={{ 
            borderColor: mode === "dark" ? "#434343" : "#d9d9d9",
            margin: "24px 0"
          }} />

          {/* Parent Information */}
          <Col span={24}>
            <Title level={3} style={{ 
              color: mode === "dark" ? "#ffffff" : "#000000",
              marginBottom: "16px"
            }}>
              Parent Information
            </Title>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Mother:
                  </Text>
                  <br />
                  <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666" }}>
                    {motherName}
                  </Text>
                </div>
              </Col>
              
              <Col xs={24} sm={12}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Father:
                  </Text>
                  <br />
                  <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666" }}>
                    {fatherName}
                  </Text>
                </div>
              </Col>
            </Row>
          </Col>

          {/* Notes */}
          {litterData?.notes && (
            <>
              <Divider style={{ 
                borderColor: mode === "dark" ? "#434343" : "#d9d9d9",
                margin: "24px 0"
              }} />
              
              <Col span={24}>
                <Title level={3} style={{ 
                  color: mode === "dark" ? "#ffffff" : "#000000",
                  marginBottom: "16px"
                }}>
                  Notes
                </Title>
                
                <div style={{
                  backgroundColor: mode === "dark" ? "#141414" : "#f5f5f5",
                  padding: "16px",
                  borderRadius: "8px",
                  border: `1px solid ${mode === "dark" ? "#434343" : "#d9d9d9"}`
                }}>
                  <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666" }}>
                    {litterData.notes}
                  </Text>
                </div>
              </Col>
            </>
          )}
        </Row>
      </Card>
    </Show>
  );
};
