import { List, useTable, useNotificationProvider } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { Table, Button, Tag, Space, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { supabaseClient as supabase } from "../../utility/supabaseClient";
import { extractFileNameFromUrl } from "../../utility/functions";

export const CatList = () => {
  const navigate = useNavigate();
  const { mode } = useContext(ColorModeContext);
  
  const { mutate: deleteCat } = useDelete();
  const { open } = useNotificationProvider();

  // Custom delete function that removes associated files before deleting the cat
  const handleDeleteCat = async (cat: any) => {
    try {
      // Remove profile picture if it exists
      if (cat.profile_picture_url) {
        const profileFileName = extractFileNameFromUrl(cat.profile_picture_url);
        if (profileFileName) {
          const { error: profileError } = await supabase.storage
            .from('cat-assets')
            .remove([`profile-pictures/${profileFileName}`]);
          
          if (profileError) {
            console.warn('Failed to delete profile picture:', profileError.message);
          }
        }
      }

      // Remove cover picture if it exists
      if (cat.cover_picture_url) {
        const coverFileName = extractFileNameFromUrl(cat.cover_picture_url);
        if (coverFileName) {
          const { error: coverError } = await supabase.storage
            .from('cat-assets')
            .remove([`covers/${coverFileName}`]);
          
          if (coverError) {
            console.warn('Failed to delete cover picture:', coverError.message);
          }
        }
      }

      // Delete the cat record
      await deleteCat({ resource: "cats", id: cat.id });

      open({
        type: "success",
        message: "Cat deleted successfully",
        description: "Cat and associated files have been removed",
      });
    } catch (error) {
      open({
        type: "error",
        message: "Failed to delete cat",
        description: String(error),
      });
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
  
  const { tableProps } = useTable({
    resource: "cats",
    pagination: {
      mode: "off",
    },
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
  });

  // Create a map of all cats for efficient parent lookup
  const catsMap = tableProps.dataSource?.reduce((acc: any, cat: any) => {
    acc[cat.id] = cat;
    return acc;
  }, {}) || {};

  const columns: any[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
      render: (text: string, record: any) => (
        <div 
          style={{ 
            fontWeight: "500", 
            color: text ? (mode === "dark" ? "#ffffff" : "#000000") : "#999999",
            wordWrap: "break-word",
            whiteSpace: "normal",
            lineHeight: "1.4",
            cursor: "pointer",
            fontSize: "16px"
          }}
          onClick={() => navigate(`/cats/show/${record.id}`)}
        >
          {text || `cat #${record.id}`}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 200,
      render: (status: string, record: any) => {
        if (!status) return <Tag color="default">Unknown</Tag>;
        
        const statusLower = status.toLowerCase();
        let color = "default";
        
        if (statusLower.includes('alive')) {
          color = "green";
        } else if (statusLower.includes('dead')) {
          color = "purple";
        } else if (statusLower.includes('missing')) {
          color = "red";
        }
        
        const statusTag = <Tag color={color}>{status}</Tag>;
        
        // Show additional date tag for dead or missing cats
        if (statusLower.includes('dead') && record.death_date) {
          const deathDate = new Date(record.death_date).toLocaleDateString();
          return (
            <Space wrap>
              {statusTag}
              <Tag color="purple" style={{ opacity: 0.7 }}>
                {deathDate}
              </Tag>
            </Space>
          );
        }
        
        if (statusLower.includes('missing') && record.missing_since) {
          const missingDate = new Date(record.missing_since).toLocaleDateString();
          return (
            <Space wrap>
              {statusTag}
              <Tag color="red" style={{ opacity: 0.7 }}>
                {missingDate}
              </Tag>
            </Space>
          );
        }
        
        return statusTag;
      },
    },
    {
      title: "Age",
      dataIndex: "birth_date",
      key: "age",
      width: 120,
      render: (birthDate: string, record: any) => {
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
      },
    },
    {
      title: "Eyes",
      dataIndex: "eye_color",
      key: "eyes",
      width: 100,
      render: (eyeColor: string) => {
        if (!eyeColor) return <span style={{ color: '#999' }}>Unknown</span>;
        
        // Map eye colors to hex colors
        const getEyeColorHex = (color: string) => {
          const colorLower = color.toLowerCase();
          switch (colorLower) {
            case 'amber': return '#ffbf00';
            case 'copper': return '#b87333';
            case 'yellow': return '#ffd700';
            case 'green': return '#228b22';
            case 'blue': return '#4169e1';
            case 'hazel': return '#8b4513';
            case 'aqua': return '#00ffff';
            case 'odd_eyed': return '#9370db'; // purple for special case
            case 'dichroic': return '#ff69b4'; // pink for special case
            default: return '#666666';
          }
        };
        
        const hexColor = getEyeColorHex(eyeColor);
        
        return (
          <Tag style={{ 
            borderColor: hexColor, 
            color: hexColor,
            backgroundColor: 'transparent'
          }}>
            {eyeColor}
        </Tag>
        );
      },
    },
    {
      title: "Fur",
      key: "fur",
      width: 250,
      render: (_: any, record: any) => {
        const furColor = record.fur_color;
        const furPattern = record.fur_pattern;
        const furLength = record.fur_length;
        
        const tags = [];
        
        // Fur color tags
        if (furColor) {
          // Map fur colors to hex colors
          const getFurColorHex = (color: string) => {
            const colorLower = color.toLowerCase();
            switch (colorLower) {
              case 'black': return '#000000';
              case 'white': return '#ffffff';
              case 'brown': return '#8b4513';
              case 'cinnamon': return '#d2691e';
              case 'blue': return '#4169e1';
              case 'lilac': return '#c8a2c8';
              case 'fawn': return '#e5aa70';
              case 'orange': return '#ff8c00';
              case 'cream': return '#f5f5dc';
              case 'olive': return '#808000';
              default: return '#666666';
            }
          };
          
          // Handle both single color (string) and multiple colors (array)
          const colors = Array.isArray(furColor) ? furColor : [furColor];
          
          colors.forEach((color, index) => {
            const hexColor = getFurColorHex(color);
            
            tags.push(
              <Tag key={`color-${index}`} style={{ 
                borderColor: hexColor, 
                color: hexColor,
                backgroundColor: 'transparent'
              }}>
                {color}
              </Tag>
            );
          });
        }
        
        // Fur pattern tag (gold)
        if (furPattern) {
          tags.push(
            <Tag key="pattern" color="gold">
              {furPattern}
            </Tag>
          );
        }
        
        // Fur length tag (orange gradient based on length)
        if (furLength) {
          let color = '#fa8c16'; // default medium orange
          
          if (furLength.toLowerCase() === 'hairless') {
            color = '#d9d9d9'; // grey for hairless
          } else if (furLength.toLowerCase() === 'short') {
            color = '#ffa940'; // lighter orange for short
          } else if (furLength.toLowerCase() === 'long') {
            color = '#d4380d'; // darker/hotter orange for long
          }
          
          tags.push(
            <Tag key="length" style={{ borderColor: color, color: color, backgroundColor: 'transparent' }}>
              {furLength}
            </Tag>
          );
        }
        
        if (tags.length === 0) {
          return <span style={{ color: '#999' }}>Unknown</span>;
        }
        
        return <Space size="small" wrap>{tags}</Space>;
      },
    },
    {
      title: "Mother",
      dataIndex: "mother_id",
      key: "mother",
      width: 100,
      render: (motherId: number) => {
        if (!motherId) return <span style={{ color: '#999' }}>Unknown</span>;
        
        const mother = catsMap[motherId];
        if (!mother) return <span style={{ color: '#999' }}>Unknown</span>;
        
        return <span style={{ fontWeight: '500' }}>{mother.name}</span>;
      },
    },
    {
      title: "Father",
      dataIndex: "father_id",
      key: "father",
      width: 100,
      render: (fatherId: number) => {
        if (!fatherId) return <span style={{ color: '#999' }}>Unknown</span>;
        
        const father = catsMap[fatherId];
        if (!father) return <span style={{ color: '#999' }}>Unknown</span>;
        
        return <span style={{ fontWeight: '500' }}>{father.name}</span>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
            render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/cats/show/${record.id}`)}
            style={{
              color: mode === "dark" ? "#000000" : "#ffffff"
            }}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/cats/edit/${record.id}`)}
          />
          <Popconfirm
            title="Delete Cat"
            description="Are you sure you want to delete this cat? This will also remove all associated files (profile and cover pictures). This action cannot be undone."
            onConfirm={() => handleDeleteCat(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{tableScrollStyles}</style>
      <List
              headerButtons={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/cats/create")}
          style={{
            color: mode === "dark" ? "#000000" : "#ffffff"
          }}
        >
          Add Cat
        </Button>
      }
      >
        <Table
        {...tableProps}
        columns={columns}
        rowKey="id"
        className="hide-scrollbar"
        pagination={false}
      />
      </List>
    </>
  );
}; 