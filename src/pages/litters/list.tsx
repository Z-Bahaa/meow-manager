import { List, useTable, EditButton, ShowButton, DeleteButton, useNotificationProvider } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Table, Space, Button, Popconfirm } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";

export const LitterList = () => {
  const { mode } = useContext(ColorModeContext);
  const { open } = useNotificationProvider();
  const navigate = useNavigate();

  const { tableProps } = useTable({
    resource: "litters",
    pagination: {
      mode: "off", // Get all litters without pagination
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

  // Fetch all cats for parent name lookup
  const { data: allCatsData } = useList({
    resource: "cats",
    pagination: {
      mode: "off", // Get all cats without pagination
    },
  });

  // Create a map of all cats for efficient parent lookup
  const catsMap = allCatsData?.data?.reduce((acc: any, cat: any) => {
    acc[cat.id] = cat;
    return acc;
  }, {}) || {};

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "Mother",
      dataIndex: "mother_id",
      key: "mother_id",
      width: 150,
      render: (motherId: number) => {
        const mother = catsMap[motherId];
        return mother ? (mother.name || `Cat #${motherId}`) : "Unknown";
      },
    },
    {
      title: "Father",
      dataIndex: "father_id",
      key: "father_id",
      width: 150,
      render: (fatherId: number) => {
        const father = catsMap[fatherId];
        return father ? (father.name || `Cat #${fatherId}`) : "Unknown";
      },
    },
    {
      title: "Birth Date",
      dataIndex: "birth_date",
      key: "birth_date",
      width: 150,
      render: (date: string) => {
        return date ? new Date(date).toLocaleDateString() : "Unknown";
      },
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 120,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      width: 120,
      render: (_: any, record: any) => (
        <Space size="small">
          <ShowButton hideText size="small" recordItemId={record.id} />
          <EditButton hideText size="small" recordItemId={record.id} />
          <Popconfirm
            title="Are you sure you want to delete this litter?"
            onConfirm={() => {
              // Delete logic will be handled by Refine
            }}
            okText="Yes"
            cancelText="No"
          >
            <DeleteButton hideText size="small" recordItemId={record.id} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <List
        headerButtons={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/litters/create")}
            style={{
              color: mode === "dark" ? "#000000" : "#ffffff"
            }}
          >
            Add Litter
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
