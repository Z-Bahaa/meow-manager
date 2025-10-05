import { Show, useTable } from "@refinedev/antd";
import { Typography, Button, Image, Tag, Card, Space, Avatar, Divider, Table, Popconfirm, message, Input } from "antd";
import { EditOutlined, ArrowLeftOutlined, GlobalOutlined, EyeOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useOne, useMany, useList, useDelete } from "@refinedev/core";
import { supabaseClient as supabase } from "../../utility/supabaseClient";

const { Title, Text, Paragraph } = Typography;

export const CatShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode } = useContext(ColorModeContext);
  const [titleSearchText, setTitleSearchText] = useState("");
  const [codeSearchText, setCodeSearchText] = useState("");

  // Fetch cat data
  const { data: catData, isLoading: catLoading } = useOne({
    resource: "cats",
    id: id || "",
  });

  const cat = catData?.data;

  // Update document title when cat data is loaded
  useEffect(() => {
    if (cat?.title) {
      document.title = `${cat.title} - Cat Details`;
    }
  }, [cat?.title]);

  // Fetch country data if cat has country_id
  const { data: countryData } = useMany({
    resource: "countries",
    ids: cat?.country_id ? [cat.country_id] : [],
  });

  const country = countryData?.data?.[0];

  // Fetch cat categories
  const [catCategories, setCatCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchCatCategories = async () => {
      if (cat?.id) {
        try {
          const { data, error } = await supabase
            .from('cat_categories')
            .select(`
              category_id,
              categories (
                id,
                title,
                image_url
              )
            `)
            .eq('cat_id', cat.id);

          if (error) {
            console.error('Error fetching cat categories:', error);
            setCategoriesLoading(false);
            return;
          }

          setCatCategories(data || []);
          setCategoriesLoading(false);
        } catch (error) {
          console.error('Error fetching cat categories:', error);
          setCategoriesLoading(false);
        }
      }
    };

    fetchCatCategories();
  }, [cat?.id]);

  // Fetch cat's deals
  const { tableProps, tableQueryResult } = useTable({
    resource: "deals",
    filters: {
      permanent: [
        {
          field: "cat_id",
          operator: "eq",
          value: id,
        },
        {
          field: "title",
          operator: "contains",
          value: titleSearchText,
        },
        {
          field: "code",
          operator: "contains",
          value: codeSearchText,
        },
      ],
    },
    onSearch: (values: any) => {
      setTitleSearchText((values as any).title || "");
      setCodeSearchText((values as any).code || "");
      return [];
    },
    sorters: {
      initial: [],
    },
    pagination: {
      pageSize: 10,
    },
  });

  const { data: dealsData, isLoading: dealsLoading } = tableQueryResult;

  // Fetch all countries for deal display
  const { data: allCountriesData } = useList({
    resource: "countries",
    pagination: {
      mode: "off",
    },
  });

  // Create a map of country data for quick lookup
  const countriesMap = allCountriesData?.data?.reduce((acc: any, country: any) => {
    acc[country.id] = country;
    return acc;
  }, {}) || {};

  // Delete functionality
  const { mutate: deleteDeal } = useDelete();

  // Custom delete function
  const handleDeleteDeal = async (deal: any) => {
    try {
      // If deal deletion was successful, update cat data
      if (deal.cat_id) {
        try {
          // Get current cat data
          const currentCat = cat;
          if (currentCat) {
            const currentTotalOffers = currentCat.total_offers || 0;
            const newTotalOffers = Math.max(0, currentTotalOffers - 1); // Ensure it doesn't go below 0
            
            // Prepare cat update data
            const catUpdateData: any = { total_offers: newTotalOffers };
            
            // Check if the deleted deal was the cat's top deal
            if (currentCat.discount_id === deal.id) {
              // Need to recalculate the top deal
              const remainingDeals = dealsData?.data?.filter((d: any) => d.id !== deal.id) || [];
              
              if (remainingDeals.length === 0) {
                // No deals left, clear all discount fields to null
                catUpdateData.discount = null;
                catUpdateData.discount_unit = null;
                catUpdateData.discount_type = null;
                catUpdateData.discount_id = null;
              } else {
                // Find the new top deal
                let topDeal = null;
                let highestDiscount = -1;
                let bogoDeal = null; // Store BOGO/Free Shipping deal as fallback
                
                for (const remainingDeal of remainingDeals) {
                  if (remainingDeal.type === 'discount' || remainingDeal.type === 'amountOff') {
                    const dealDiscount = remainingDeal.discount || 0;
                    if (dealDiscount > highestDiscount) {
                      highestDiscount = dealDiscount;
                      topDeal = remainingDeal;
                    }
                  } else if (remainingDeal.type === 'bogo' || remainingDeal.type === 'freeShipping') {
                    // Store BOGO/Free Shipping deal as fallback, but don't break
                    if (!bogoDeal) {
                      bogoDeal = remainingDeal;
                    }
                  }
                }
                
                // If no discount/amountOff deals found, use BOGO/Free Shipping as fallback
                if (!topDeal && bogoDeal) {
                  topDeal = bogoDeal;
                }
                
                if (topDeal) {
                  if (topDeal.type === 'discount' || topDeal.type === 'amountOff') {
                    // Set discount_unit based on deal type
                    catUpdateData.discount = topDeal.discount;
                    catUpdateData.discount_unit = topDeal.type === 'discount' ? '%' : '$';
                  } else {
                    // For BOGO and Free Shipping deals, set default values
                    catUpdateData.discount = 0;
                    catUpdateData.discount_unit = '';
                  }
                  catUpdateData.discount_type = topDeal.type;
                  catUpdateData.discount_id = topDeal.id;
                }
              }
              
              // Update the cat BEFORE deleting the deal to avoid foreign key constraint
              const { error: updateError } = await supabase
                .from('cats')
                .update(catUpdateData)
                .eq('id', deal.cat_id);
              
              if (updateError) {
                console.error('Failed to update cat:', updateError);
                message.error("Failed to update cat data");
                return; // Don't delete the deal if cat update fails
              }
            }
          }
        } catch (error) {
          console.error('Error updating cat:', error);
          message.error("Failed to update cat data");
          return; // Don't delete the deal if cat update fails
        }
      }
      
      // Now delete the deal record
      await deleteDeal({ resource: "deals", id: deal.id });

      // Update local cat data if needed
      if (deal.cat_id && cat) {
        const currentTotalOffers = cat.total_offers || 0;
        const newTotalOffers = Math.max(0, currentTotalOffers - 1);
        cat.total_offers = newTotalOffers;
        
        // Update local discount data if this was the top deal
        if (cat.discount_id === deal.id) {
          const remainingDeals = dealsData?.data?.filter((d: any) => d.id !== deal.id) || [];
          
          if (remainingDeals.length === 0) {
            cat.discount = null;
            cat.discount_unit = null;
            cat.discount_type = null;
            cat.discount_id = null;
          } else {
            // Find the new top deal for local update
            let topDeal = null;
            let highestDiscount = -1;
            let bogoDeal = null; // Store BOGO/Free Shipping deal as fallback
            
            for (const remainingDeal of remainingDeals) {
              if (remainingDeal.type === 'discount' || remainingDeal.type === 'amountOff') {
                const dealDiscount = remainingDeal.discount || 0;
                if (dealDiscount > highestDiscount) {
                  highestDiscount = dealDiscount;
                  topDeal = remainingDeal;
                }
              } else if (remainingDeal.type === 'bogo' || remainingDeal.type === 'freeShipping') {
                // Store BOGO/Free Shipping deal as fallback, but don't break
                if (!bogoDeal) {
                  bogoDeal = remainingDeal;
                }
              }
            }
            
            // If no discount/amountOff deals found, use BOGO/Free Shipping as fallback
            if (!topDeal && bogoDeal) {
              topDeal = bogoDeal;
            }
            
            if (topDeal) {
              if (topDeal.type === 'discount' || topDeal.type === 'amountOff') {
                // Set discount_unit based on deal type
                cat.discount = topDeal.discount;
                cat.discount_unit = topDeal.type === 'discount' ? '%' : '$';
              } else {
                cat.discount = 0;
                cat.discount_unit = '';
              }
              cat.discount_type = topDeal.type;
              cat.discount_id = topDeal.id;
            }
          }
        }
      }
      
      message.success("Deal deleted successfully and cat data updated");
    } catch (error) {
      message.error("Failed to delete deal");
    }
  };

  // CSS for table scrolling
  const tableScrollStyles = `
    .hide-scrollbar .ant-table-body::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar .ant-table-body {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .ant-table-wrapper::-webkit-scrollbar {
      display: none;
    }
    .ant-table-wrapper {
      scrollbar-width: none;
      -ms-overflow-style: none;
      overflow: auto;
    }
    
    .ant-table::-webkit-scrollbar {
      display: none;
    }
    .ant-table {
      scrollbar-width: none;
      -ms-overflow-style: none;
      min-width: 800px;
    }
    
    .ant-table-body::-webkit-scrollbar {
      display: none;
    }
    .ant-table-body {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .ant-table-header::-webkit-scrollbar {
      display: none;
    }
    .ant-table-header {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .ant-table th:last-child,
    .ant-table td:last-child {
      max-width: fit-content !important;
    }
    
    .ant-pagination {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      margin-top: 16px !important;
    }
    
    @media (max-width: 850px) {
      .action-button {
        min-width: 32px !important;
        padding: 4px 8px !important;
      }
    }
    
    @media (max-width: 768px) {
      .ant-table {
        min-width: 600px;
      }
      
      .ant-table-scroll {
        max-width: calc(100vw - 80px) !important;
      }
    }
    
    @media (max-width: 480px) {
      .ant-table-scroll {
        max-width: calc(100vw - 60px) !important;
      }
    }
    
    @media (max-width: 320px) {
      .ant-table-scroll {
        max-width: calc(100vw - 40px) !important;
      }
    }
  `;

  // Search functionality for table columns
  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => {
            confirm();
            // Trigger server-side search for specific column
            if (dataIndex === "title") {
              setTitleSearchText(selectedKeys[0] || "");
            } else if (dataIndex === "code") {
              setCodeSearchText(selectedKeys[0] || "");
            }
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
              confirm();
              // Trigger server-side search for specific column
              if (dataIndex === "title") {
                setTitleSearchText(selectedKeys[0] || "");
              } else if (dataIndex === "code") {
                setCodeSearchText(selectedKeys[0] || "");
              }
            }}
            icon={<SearchOutlined />}
            size="small"
            style={{ 
              width: 90,
              color: mode === "dark" ? "#000000" : "#ffffff"
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters && clearFilters();
              // Clear server-side search for specific column
              if (dataIndex === "title") {
                setTitleSearchText("");
              } else if (dataIndex === "code") {
                setCodeSearchText("");
              }
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: any, record: any) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes((value as string).toLowerCase())
        : false,
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => {
          const element = document.getElementById('search-input') as HTMLInputElement;
          element?.select();
        }, 100);
      }
    },
  });

  // Deals table columns
  const dealsColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 150,
      ...getColumnSearchProps("title"),
      render: (text: string) => (
        <div style={{ 
          fontWeight: "500", 
          color: mode === "dark" ? "#ffffff" : "#000000",
          wordWrap: "break-word",
          whiteSpace: "normal",
          lineHeight: "1.4"
        }}>
          {text}
        </div>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 150,
      ...getColumnSearchProps("code"),
      render: (text: string) => (
        <div style={{ 
          backgroundColor: mode === "dark" ? "#1f1f1f" : "#f0f0f0",
          color: mode === "dark" ? "#ffffff" : "#333333",
          maxWidth: "130px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontFamily: "monospace",
          fontSize: "16px",
          fontWeight: "600",
          padding: "4px 8px",
          borderRadius: "6px",
          border: `1px solid ${mode === "dark" ? "#434343" : "#d9d9d9"}`,
          display: "inline-block"
        }}>
          {text || "No code"}
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      filters: [
        { text: 'Discount', value: 'discount' },
        { text: 'Amount Off', value: 'amountOff' },
        { text: 'BOGO', value: 'bogo' },
        { text: 'Free Shipping', value: 'freeShipping' },
      ],
      onFilter: (value: any, record: any) => record.type === (value as string),
      render: (type: string) => {
        const typeConfig = {
          bogo: { label: "BOGO", color: "blue" },
          freeShipping: { label: "Free Shipping", color: "green" },
          amountOff: { label: "Amount Off", color: "orange" },
          discount: { label: "Discount", color: "purple" }
        };
        
        const config = typeConfig[type as keyof typeof typeConfig] || { label: type, color: "default" };
        
        return (
          <Tag color={config.color} style={{ fontSize: "12px", fontWeight: "500" }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      width: 150,
      sorter: true,
      render: (discount: number, record: any) => {
        // Don't show discount for bogo and freeShipping types
        if (record.type === "bogo" || record.type === "freeShipping") {
          return null;
        }
        
        // Get the country for currency code lookup
        let currencyDisplay = record.discount_unit;
        
        // For amountOff type, try to get the English currency code from the country
        if (record.type === "amountOff") {
          const country = countriesMap[record.country_id];
          if (country?.currency_code?.en) {
            currencyDisplay = country.currency_code.en;
          }
        }
        
        return (
          <Tag 
            style={{ 
              fontSize: "12px", 
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "4px 8px",
              height: "auto",
              width: "fit-content",
              color: mode === "light" ? "#722ed1" : "#faad14",
              borderColor: mode === "light" ? "#722ed1" : "#faad14",
              backgroundColor: "transparent"
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: "600" }}>{discount}</span>
            {currencyDisplay && (
              <span style={{ 
                fontSize: "12px", 
                opacity: 0.9,
                textTransform: "uppercase",
                fontWeight: "500"
              }}>
                {currencyDisplay}
              </span>
            )}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 150,
      render: (isActive: boolean, record: any) => (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
          {record.is_featured && (
            <Tag color="gold" style={{ fontSize: "10px", padding: "2px 6px" }}>
              Featured
            </Tag>
          )}
          {record.is_trending && (
            <Tag color="volcano" style={{ fontSize: "10px", padding: "2px 6px" }}>
              Trending
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Clicks",
      dataIndex: "click_count",
      key: "click_count",
      width: 100,
      sorter: true,
      render: (clicks: number) => (
        <span style={{ 
          fontSize: "12px", 
          color: clicks > 0 ? "#52c41a" : "#999",
          fontWeight: clicks > 0 ? "500" : "normal"
        }}>
          {clicks || 0}
        </span>
      ),
    },

    {
      title: "Expiry Date",
      dataIndex: "expiry_date",
      key: "expiry_date",
      width: 120,
      sorter: true,
      render: (date: string) => {
        const expiryDate = new Date(date);
        const now = new Date();
        const isExpired = expiryDate < now;
        const isExpiringSoon = expiryDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        return (
          <span style={{ 
            fontSize: "12px", 
            color: isExpired ? "#ff4d4f" : isExpiringSoon ? "#faad14" : "#52c41a",
            fontWeight: isExpired || isExpiringSoon ? "500" : "normal"
          }}>
            {expiryDate.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined style={{ color: mode === "dark" ? "#000000" : "#ffffff" }} />}
            size="small"
            onClick={() => navigate(`/deals/show/${record.id}`)}
            className="action-button"
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/deals/edit/${record.id}`)}
            className="action-button"
          />
          <Popconfirm
            title="Delete Deal"
            description="Are you sure you want to delete this deal? This action cannot be undone."
            onConfirm={() => handleDeleteDeal(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            styles={{ root: { maxWidth: 400 } }}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              className="action-button"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (catLoading) {
    return <div>Loading...</div>;
  }

  if (!cat) {
    return <div>Cat not found</div>;
  }

  return (
    <Show
      headerButtons={[
        <Button
          key="back"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/cats")}
        >
          Back to List
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/cats/edit/${id}`)}
          style={{
            color: mode === "dark" ? "#000000" : "#ffffff"
          }}
        >
          Edit
        </Button>,
      ]}
    >
      <div style={{ width: "100%" }}>
        {/* Cat Header Card with Cover Image */}
        <Card 
          style={{ marginBottom: "16px", padding: 0, overflow: "hidden" }}
          bodyStyle={{ padding: 0 }}
        >
          {/* Cover Image as Background */}
          {cat.cover_picture_url && (
            <div 
              style={{
                width: "100%",
                height: "180px",
                backgroundImage: `url(${cat.cover_picture_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                margin: 0,
                padding: 0,
                position: "relative",
              }}
            >
              {/* Gradient Overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "100%",
                  background: `linear-gradient(to bottom, transparent, ${mode === "dark" ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)"})`,
                }}
              />
            </div>
          )}

          {/* Cat Info */}
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", }}>
              {/* Profile Picture */}
              {cat.profile_picture_url && (
                <Avatar
                  size={100}
                  src={cat.profile_picture_url}
                  style={{ flexShrink: 0 }}
                />
              )}
              
              {/* Title and Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                  <div>
                    <Title level={2} style={{ margin: "0 0 0px 0" }}>
                  {cat.title}
                </Title>
                
                {cat.slug && (
                      <Text type="secondary" style={{ fontSize: "16px", display: "block", marginBottom: "4px" }}>
                        @{cat.slug}
                  </Text>
                )}
                  </div>

                                  {/* Status Tags */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px", alignItems: "flex-end" }}>
                    {/* Top row - Active/Inactive and Age tags */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <Tag 
                      color={cat.is_active ? "green" : "default"}
                      style={{ 
                        fontSize: "14px",
                        padding: "4px 8px",
                        height: "auto",
                        minWidth: "80px",
                        justifyContent: "center",
                        alignItems: "center",
                        display: "flex",
                        textAlign: "center",
                        backgroundColor: mode === "light" ? "#e8e8e8" : undefined,
                        borderColor: mode === "light" ? "#bfbfbf" : undefined,
                        color: mode === "light" ? "#434343" : undefined,
                      }}
                    >
                      {cat.is_active ? "Active" : "Inactive"}
                    </Tag>
                    
                    {cat.age !== undefined && (
                      <Tag 
                        color="blue"
                        style={{ 
                          fontSize: "14px",
                          padding: "4px 8px",
                          height: "auto",
                          minWidth: "80px",
                          justifyContent: "center",
                          alignItems: "center",
                          display: "flex",
                          textAlign: "center",
                        }}
                      >
                        {cat.age} years old
                      </Tag>
                    )}
                    </div>
                  </div>
                </div>

                {/* Categories */}
                {catCategories.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {catCategories.map((item: any) => (
                        <Tag
                          key={item.category_id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "4px 8px",
                            fontSize: "14px",
                            height: "auto",
                            margin: "2px 0",
                            color: mode === "light" ? "#722ed1" : "#faad14",
                            borderColor: mode === "light" ? "#722ed1" : "#faad14",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onClick={() => navigate(`/categories/show/${item.category_id}`)}
                        >
                          {item.categories?.image_url && (
                            <Image
                              src={item.categories.image_url}
                              width={16}
                              height={16}
                              style={{ 
                                marginBottom: "7px",
                                filter: mode === "light" 
                                  ? "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(246deg) brightness(104%) contrast(97%)"
                                  : "brightness(0) saturate(100%) invert(84%) sepia(31%) saturate(6382%) hue-rotate(359deg) brightness(103%) contrast(107%)"
                              }}
                              preview={false}
                            />
                          )}
                          <span>{item.categories?.title}</span>
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}


              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        {cat.description && (
          <Card style={{ marginBottom: "16px" }}>
            <Title level={4} style={{ margin: "0 0 12px 0" }}>
              About
            </Title>
            <Paragraph style={{ margin: 0, fontSize: "16px", lineHeight: "1.6" }}>
              {cat.description}
            </Paragraph>
          </Card>
        )}

        {/* Cat's Details Section */}
        <Card style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <Title level={4} style={{ margin: 0 }}>
              Cat Details
            </Title>
          </div>
          
            <div style={{ 
              textAlign: "center", 
              padding: "40px 20px",
              color: mode === "dark" ? "#999" : "#666"
            }}>
            This cat is ready for adoption! Contact us for more information.
            </div>
        </Card>
      </div>
    </Show>
  );
}; 