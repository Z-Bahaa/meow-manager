import { Show, EditButton, DeleteButton, useNotificationProvider } from "@refinedev/antd";
import { useShow, useList } from "@refinedev/core";
import { Typography, Space, Button, Card, Row, Col, Tag, Divider } from "antd";
import { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { CatCard } from "../../components";

const { Title, Text } = Typography;

export const CatShow = () => {
  const { mode } = useContext(ColorModeContext);
  const { open } = useNotificationProvider();
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;

  // Fetch all cats once for efficiency
  const { data: allCatsData } = useList({
    resource: "cats",
    pagination: {
      mode: "off", // Get all cats without pagination
    },
  });

  // Fetch all litters for litter names
  const { data: allLittersData } = useList({
    resource: "litters",
    pagination: {
      mode: "off", // Get all litters without pagination
    },
  });

  // Create a map for quick cat lookup
  const catsMap = new Map();
  allCatsData?.data?.forEach((cat: any) => {
    catsMap.set(cat.id, cat);
  });

  // Create a map for quick litter lookup
  const littersMap = new Map();
  allLittersData?.data?.forEach((litter: any) => {
    littersMap.set(litter.id, litter);
  });

  const catData = data?.data;

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

  // Get parents
  const mother = catData?.mother_id ? catsMap.get(catData.mother_id) : null;
  const father = catData?.father_id ? catsMap.get(catData.father_id) : null;

  // Get littermates (cats from the same litter, excluding current cat)
  const littermates = allCatsData?.data?.filter((cat: any) => 
    cat.litter_id === catData?.litter_id && cat.id !== catData?.id
  ) || [];

  // Get other siblings (cats with same mother or father, excluding littermates and current cat)
  const otherSiblings = allCatsData?.data?.filter((cat: any) => {
    if (cat.id === catData?.id) return false;
    if (cat.litter_id === catData?.litter_id) return false; // Exclude littermates
    
    return (catData?.mother_id && cat.mother_id === catData.mother_id) ||
           (catData?.father_id && cat.father_id === catData.father_id);
  }) || [];

  // Get children (cats where this cat is the mother or father)
  const children = allCatsData?.data?.filter((cat: any) => 
    cat.mother_id === catData?.id || cat.father_id === catData?.id
  ) || [];

  // Group children by litter
  const childrenByLitter = children.reduce((acc: any, child: any) => {
    const litterId = child.litter_id;
    if (!acc[litterId]) {
      acc[litterId] = [];
    }
    acc[litterId].push(child);
    return acc;
  }, {});

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
          {/* Cat Name and Birth Date */}
          <Col span={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <Title level={2} style={{ 
                  color: mode === "dark" ? "#ffffff" : "#000000",
                  marginBottom: "8px"
                }}>
                  {catData?.name || "Unnamed Cat"}
                </Title>
                
                <Text style={{ 
                  color: mode === "dark" ? "#d9d9d9" : "#666666",
                  fontSize: "16px"
                }}>
                  Born: {catData?.birth_date ? 
                    new Date(catData.birth_date).toLocaleDateString() : 
                    "Unknown"
                  }
                </Text>
                <br />
                <Text style={{ 
                  color: mode === "dark" ? "#d9d9d9" : "#666666",
                  fontSize: "16px"
                }}>
                  Age: {calculateAge(catData?.birth_date, catData)}
                </Text>
              </div>
              
              <div>
                <Tag 
                  color={catData?.status === "alive" ? "green" : 
                         catData?.status === "dead" ? "red" : "orange"}
                  style={{ fontSize: "16px", padding: "8px 16px" }}
                >
                  {catData?.status === "missing" && catData?.missing_since ? 
                    `Missing since ${new Date(catData.missing_since).toLocaleDateString('en-GB')}` :
                    catData?.status === "dead" && catData?.death_date ?
                    `Dead since ${new Date(catData.death_date).toLocaleDateString('en-GB')}` :
                    catData?.status?.charAt(0).toUpperCase() + catData?.status?.slice(1) || "Unknown"
                  }
                </Tag>
              </div>
        </div>
          </Col>

          <Divider style={{ 
            borderColor: mode === "dark" ? "#434343" : "#d9d9d9",
            margin: "24px 0"
          }} />

          {/* Details */}
          <Col span={24}>
            <Title level={3} style={{ 
              color: mode === "dark" ? "#ffffff" : "#000000",
              marginBottom: "16px"
            }}>
              Details
            </Title>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Eye Color:
                  </Text>
                  <br />
                  <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666" }}>
                    {catData?.eye_color || "Unknown"}
                  </Text>
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Fur Color:
                  </Text>
                  <br />
                  {catData?.fur_color && catData.fur_color.length > 0 ? (
                    <Tag color="blue">
                      {catData.fur_color.join(", ")}
                    </Tag>
                  ) : (
                    <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666" }}>
                      Unknown
                    </Text>
                  )}
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Fur Pattern:
                  </Text>
                  <br />
                  {catData?.fur_pattern ? (
                    <Tag color="gold">
                      {catData.fur_pattern}
                    </Tag>
                  ) : (
                    <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666" }}>
                      Unknown
                    </Text>
                  )}
                </div>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text strong style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}>
                    Fur Length:
                  </Text>
                  <br />
                  <Text style={{ color: mode === "dark" ? "#d9d9d9" : "#666666" }}>
                    {catData?.fur_length || "Unknown"}
                  </Text>
                </div>
              </Col>
            </Row>
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
                      cat={mother} 
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
                      cat={father} 
                      calculateAge={calculateAge}
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </Col>

          {/* Littermates */}
          {littermates.length > 0 && (
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
                  Littermates ({littermates.length})
                </Title>
                
                <Row gutter={[16, 16]}>
                  {littermates.map((littermate: any) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={littermate.id}>
                      <CatCard 
                        cat={littermate} 
                        calculateAge={calculateAge}
                      />
                    </Col>
                  ))}
                </Row>
              </Col>
            </>
          )}

          {/* Other Siblings */}
          {otherSiblings.length > 0 && (
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
                  Other Siblings ({otherSiblings.length})
                </Title>
                
                <Row gutter={[16, 16]}>
                  {otherSiblings.map((sibling: any) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={sibling.id}>
                      <CatCard 
                        cat={sibling} 
                        calculateAge={calculateAge}
                      />
                    </Col>
                  ))}
                </Row>
              </Col>
            </>
          )}

          {/* Children */}
          {children.length > 0 && (
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
                  Children ({children.length})
                </Title>
                
                {Object.entries(childrenByLitter).map(([litterId, litterChildren]: [string, any]) => {
                  const litter = littersMap.get(parseInt(litterId));
                  const litterName = litter?.name || `Litter ${litterId}`;
                  
                  return (
                    <div key={litterId} style={{ marginBottom: "24px" }}>
                      <Title level={4} style={{ 
                        color: mode === "dark" ? "#ffffff" : "#000000",
                        marginBottom: "12px"
                      }}>
                        {litterName} ({litterChildren.length} kittens)
                      </Title>
                      
                      <Row gutter={[16, 16]}>
                        {litterChildren.map((child: any) => (
                          <Col xs={24} sm={12} md={8} lg={6} key={child.id}>
                            <CatCard 
                              cat={child} 
                              calculateAge={calculateAge}
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>
                  );
                })}
              </Col>
            </>
          )}

          {/* Notes */}
          {catData?.notes && (
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
                    {catData.notes}
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