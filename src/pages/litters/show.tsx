import { Show, EditButton, DeleteButton, useNotificationProvider } from "@refinedev/antd";
import { useShow, useList } from "@refinedev/core";
import { Typography, Space, Button, Card, Row, Col, Tag, Divider } from "antd";
import { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { CatCard } from "../../components";

const { Title, Text } = Typography;

export const LitterShow = () => {
  const { mode } = useContext(ColorModeContext);
  const { open } = useNotificationProvider();
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;

  // Fetch all cats for parent names and kittens
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

  // Get kittens from this litter
  const kittens = allCatsData?.data?.filter((cat: any) => cat.litter_id === litterData?.id) || [];

  // Helper function to calculate and format age (same as cats list)
  const calculateAge = (birthDate: string, record: any) => {
    if (!birthDate) return <span style={{ color: '#999' }}>Unknown</span>;
    
    const birth = new Date(birthDate);
    const statusLower = record.status?.toLowerCase() || '';
    
    // For dead cats, calculate age at death
    let endDate = new Date();
    let isDead = false;
    
    if (statusLower.includes('dead') && record.death_date) {
      endDate = new Date(record.death_date);
      isDead = true;
    }
    
    const diffTime = endDate.getTime() - birth.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <span style={{ color: '#999' }}>Invalid</span>;
    
    // Helper function to format age
    const formatAge = (days: number, isDeceased: boolean = false) => {
      const prefix = isDeceased ? 'died at ' : '';
      
      // Less than 1 month (30 days) - show days
      if (days < 30) {
        return <span style={{ fontWeight: 'bold', color: isDeceased ? '#722ed1' : '#52c41a' }}>
          {prefix}{days} {days === 1 ? 'day' : 'days'}
        </span>;
      }
      
      // Less than 5 months (150 days) - show weeks
      if (days < 150) {
        const weeks = Math.floor(days / 7);
        return <span style={{ fontWeight: 'bold', color: isDeceased ? '#722ed1' : '#1890ff' }}>
          {prefix}{weeks} {weeks === 1 ? 'week' : 'weeks'}
        </span>;
      }
      
      // 5 months or more - show years and months
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      const months = Math.floor(remainingDays / 30);
      
      if (years === 0) {
        return <span style={{ fontWeight: 'bold', color: isDeceased ? '#722ed1' : '#fa8c16' }}>
          {prefix}{months} {months === 1 ? 'month' : 'months'}
        </span>;
      }
      
      if (months === 0) {
        return <span style={{ fontWeight: 'bold', color: isDeceased ? '#722ed1' : '#722ed1' }}>
          {prefix}{years} {years === 1 ? 'year' : 'years'}
        </span>;
      }
      
      return <span style={{ fontWeight: 'bold', color: isDeceased ? '#722ed1' : '#722ed1' }}>
        {prefix}{years}y {months}m
      </span>;
    };
    
    return formatAge(diffDays, isDead);
  };

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
          {/* Name and Date */}
          <Col span={24}>
            <Title level={2} style={{ 
              color: mode === "dark" ? "#ffffff" : "#000000",
              marginBottom: "8px"
            }}>
              {litterData?.name || "Unnamed Litter"}
            </Title>
            
            <Text style={{ 
              color: mode === "dark" ? "#d9d9d9" : "#666666",
              fontSize: "16px"
            }}>
              Born: {litterData?.birth_date ? 
                new Date(litterData.birth_date).toLocaleDateString() : 
                "Unknown"
              }
            </Text>
          </Col>

          <Divider style={{ 
            borderColor: mode === "dark" ? "#434343" : "#d9d9d9",
            margin: "24px 0"
          }} />

          {/* Parents */}
          <Col span={24}>
            <Title level={3} style={{ 
              color: mode === "dark" ? "#ffffff" : "#000000",
              marginBottom: "16px"
            }}>
              Parents
            </Title>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Mother:
                  </Text>
                  <br />
                  <div style={{ marginTop: "8px" }}>
                    <CatCard 
                      cat={litterData?.mother_id ? catsMap.get(litterData.mother_id) : null} 
                      calculateAge={calculateAge}
                    />
                  </div>
                </div>
              </Col>
              
              <Col xs={24} sm={12}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Father:
                  </Text>
                  <br />
                  <div style={{ marginTop: "8px" }}>
                    <CatCard 
                      cat={litterData?.father_id ? catsMap.get(litterData.father_id) : null} 
                      calculateAge={calculateAge}
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </Col>

          {/* Kittens */}
          {kittens.length > 0 && (
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
                  Kittens ({kittens.length})
                </Title>
                
                <Row gutter={[16, 16]}>
                  {kittens.map((kitten: any) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={kitten.id}>
                      <CatCard 
                        cat={kitten} 
                        calculateAge={calculateAge}
                      />
                    </Col>
                  ))}
                </Row>
              </Col>
            </>
          )}

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
