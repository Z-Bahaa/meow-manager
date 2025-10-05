import { Edit, useForm, useNotificationProvider } from "@refinedev/antd";
import { Form, Input, Button, DatePicker, Select, InputNumber, message } from "antd";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useList } from "@refinedev/core";
import dayjs from "dayjs";

export const LitterEdit = () => {
  const { mode } = useContext(ColorModeContext);
  const { formProps, saveButtonProps, formLoading, query, form } = useForm();

  const { open } = useNotificationProvider();

  // Form initialization state
  const [formInitialized, setFormInitialized] = useState(false);

  // Fetch all cats for parent selection
  const { data: allCatsData, isLoading: catsLoading } = useList({
    resource: "cats",
    pagination: {
      mode: "off", // Get all cats without pagination
    },
  });

  // Update document title when litter data is loaded
  useEffect(() => {
    if (query?.data?.data?.id) {
      document.title = `Edit Litter #${query.data.data.id} - Litter`;
    }
  }, [query?.data?.data?.id]);

  // Set initial form values and convert date strings to dayjs objects
  useEffect(() => {
    // Reset initialization state when query data changes
    setFormInitialized(false);
    
    if (query?.data?.data && formProps.form) {
      const litterData = query.data.data;
      
      // Convert date strings to dayjs objects
      const formValues = {
        ...litterData,
        birth_date: litterData.birth_date ? dayjs(litterData.birth_date) : undefined,
      };
      
      // Set form values
      formProps.form.setFieldsValue(formValues);
      
      // Mark form as initialized after a small delay to ensure form is ready
      setTimeout(() => {
        setFormInitialized(true);
      }, 100);
    }
  }, [query?.data?.data, formProps.form]);

  const handleSave = async (values: any) => {
    // Convert birth_date to local timezone if it exists
    if (values.birth_date) {
      const date = values.birth_date.toDate();
      values.birth_date = date.toISOString();
    }

    if (formProps.onFinish) {
      const result = await formProps.onFinish({ 
        ...values
      });
    } else {
      message.error("Form submit function not available");
    }
  };

  return (
    <Edit
      saveButtonProps={{ 
        ...saveButtonProps, 
        onClick: () => formProps.form?.submit(),
        style: {
          color: mode === "dark" ? "#000000" : "#ffffff"
        }
      }} 
      isLoading={formLoading || !formInitialized}
    >
      <Form {...formProps} layout="vertical" onFinish={handleSave}>
        {/* Details Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: mode === 'dark' ? '#ffffff' : '#000000',
            borderBottom: `2px solid ${mode === 'dark' ? '#434343' : '#d9d9d9'}`,
            paddingBottom: '8px'
          }}>
            Details
          </h3>
          
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter litter name" }]}
          >
            <Input placeholder="Enter litter name" />
          </Form.Item>

          <Form.Item
            label="Birth Date"
            name="birth_date"
            rules={[
              {
                validator: (_, value) => {
                  if (!formInitialized) return Promise.resolve(); // Skip validation until form is initialized
                  if (!value) return Promise.resolve();
                  if (dayjs.isDayjs(value) && value.isValid()) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Please select a valid date'));
                }
              }
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="Select birth date and time"
              style={{ width: "100%" }}
              disabled={true}
            />
          </Form.Item>

          <Form.Item
            label="Size"
            name="size"
            rules={[{ required: true, message: "Please enter litter size" }]}
          >
            <InputNumber
              placeholder="Enter number of kittens"
              min={1}
              max={20}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>

        {/* Parents Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: mode === 'dark' ? '#ffffff' : '#000000',
            borderBottom: `2px solid ${mode === 'dark' ? '#434343' : '#d9d9d9'}`,
            paddingBottom: '8px'
          }}>
            Parents
          </h3>
          
          <Form.Item
            label="Mother"
            name="mother_id"
          >
            <Select
              placeholder="Unknown"
              loading={catsLoading}
              showSearch
              optionFilterProp="children"
              disabled={true}
              filterOption={(input, option) => {
                const label = option?.label || option?.children;
                return String(label).toLowerCase().includes(input.toLowerCase());
              }}
            >
              {allCatsData?.data
                ?.filter((cat: any) => cat.gender === 'female')
                ?.map((cat: any) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.name || `Cat #${cat.id}`}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Father"
            name="father_id"
          >
            <Select
              placeholder="Unknown"
              loading={catsLoading}
              showSearch
              optionFilterProp="children"
              disabled={true}
              filterOption={(input, option) => {
                const label = option?.label || option?.children;
                return String(label).toLowerCase().includes(input.toLowerCase());
              }}
            >
              {allCatsData?.data
                ?.filter((cat: any) => cat.gender === 'male')
                ?.map((cat: any) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.name || `Cat #${cat.id}`}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </div>

        {/* Notes Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: mode === 'dark' ? '#ffffff' : '#000000',
            borderBottom: `2px solid ${mode === 'dark' ? '#434343' : '#d9d9d9'}`,
            paddingBottom: '8px'
          }}>
            Notes
          </h3>
          
          <Form.Item
            label="Notes"
            name="notes"
          >
            <Input.TextArea 
              placeholder="Enter any additional notes about the litter (optional)" 
              rows={4}
            />
          </Form.Item>
        </div>
      </Form>
    </Edit>
  );
};
