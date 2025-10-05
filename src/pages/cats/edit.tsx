import { Edit, useForm, useNotificationProvider } from "@refinedev/antd";
import { Form, Input, Button, Switch, message, DatePicker, Select } from "antd";
// import { SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useList } from "@refinedev/core";
// import { supabaseClient as supabase } from "../../utility/supabaseClient";
import { getEnumValues } from "../../utility/network/data";
import dayjs from "dayjs";

export const CatEdit = () => {
  const { mode } = useContext(ColorModeContext);
  const { formProps, saveButtonProps, formLoading, query, form } = useForm();

  // Eye color enum values
  const [eyeColorOptions, setEyeColorOptions] = useState<string[]>([]);
  const [eyeColorLoading, setEyeColorLoading] = useState(true);

  // Fur color enum values
  const [furColorOptions, setFurColorOptions] = useState<string[]>([]);
  const [furColorLoading, setFurColorLoading] = useState(true);

  // Fur pattern enum values
  const [furPatternOptions, setFurPatternOptions] = useState<string[]>([]);
  const [furPatternLoading, setFurPatternLoading] = useState(true);

  // Fur length enum values
  const [furLengthOptions, setFurLengthOptions] = useState<string[]>([]);
  const [furLengthLoading, setFurLengthLoading] = useState(true);

  // Cat status enum values
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);

  // Selected status for conditional fields
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Form initialization state
  const [formInitialized, setFormInitialized] = useState(false);

  // Fetch all cats for lineage
  const { data: allCatsData, isLoading: catsLoading } = useList({
    resource: "cats",
    pagination: {
      mode: "off", // Get all cats without pagination
    },
  });

  // Fetch all litters for litter selection
  const { data: allLittersData, isLoading: littersLoading } = useList({
    resource: "litters",
    pagination: {
      mode: "off", // Get all litters without pagination
    },
  });

  const { open } = useNotificationProvider();

  // Fetch all enum values
  useEffect(() => {
    const fetchEnumValues = async () => {
      try {
        // Fetch all enum values in parallel
        const [eyeColors, furColors, furPatterns, furLengths, statuses] = await Promise.all([
          getEnumValues('cat_eye_color'),
          getEnumValues('cat_color'),
          getEnumValues('cat_pattern'),
          getEnumValues('cat_fur_length'),
          getEnumValues('cat_status')
        ]);

        console.log('Eye colors:', eyeColors);
        console.log('Fur colors:', furColors);
        console.log('Fur patterns:', furPatterns);
        console.log('Fur lengths:', furLengths);
        console.log('Statuses:', statuses);
        console.log('Statuses type:', typeof statuses);
        console.log('Statuses length:', statuses?.length);

        setEyeColorOptions(eyeColors);
        setEyeColorLoading(false);

        setFurColorOptions(furColors);
        setFurColorLoading(false);

        setFurPatternOptions(furPatterns);
        setFurPatternLoading(false);

        setFurLengthOptions(furLengths);
        setFurLengthLoading(false);

        setStatusOptions(statuses);
        setStatusLoading(false);
        } catch (error) {
        console.error('Error fetching enum values:', error);
        console.error('Error details:', error);
        setEyeColorLoading(false);
        setFurColorLoading(false);
        setFurPatternLoading(false);
        setFurLengthLoading(false);
        setStatusLoading(false);
      }
    };

    fetchEnumValues();
  }, []);






  // Clear conditional fields when status changes
  useEffect(() => {
    if (formProps.form) {
      if (!selectedStatus.toLowerCase().includes('dead')) {
        formProps.form.setFieldValue('death_date', undefined);
      }
      if (!selectedStatus.toLowerCase().includes('missing')) {
        formProps.form.setFieldValue('missing_since', undefined);
      }
    }
  }, [selectedStatus, formProps.form]);

  // Update document title when cat data is loaded
  useEffect(() => {
    if (query?.data?.data?.name) {
      document.title = `Edit ${query.data.data.name} - Cat`;
    }
  }, [query?.data?.data?.name]);

  // Set initial form values and convert date strings to dayjs objects
  useEffect(() => {
    // Reset initialization state when query data changes
    setFormInitialized(false);
    
    if (query?.data?.data && formProps.form) {
      const catData = query.data.data;
      
      // Convert date strings to dayjs objects
      const formValues = {
        ...catData,
        birth_date: catData.birth_date ? dayjs(catData.birth_date) : undefined,
        death_date: catData.death_date ? dayjs(catData.death_date) : undefined,
        missing_since: catData.missing_since ? dayjs(catData.missing_since) : undefined,
      };
      
      // Set the status for conditional field logic
      if (catData.status) {
        setSelectedStatus(catData.status);
      }
      
      // Set form values
      formProps.form.setFieldsValue(formValues);
      
      // Mark form as initialized after a small delay to ensure form is ready
      setTimeout(() => {
        setFormInitialized(true);
      }, 100);
    }
  }, [query?.data?.data, formProps.form]);



  // const handleProfileFileChange = (info: any) => {
  //   if (info.fileList.length > 0) {
  //     const selectedFile = info.fileList[0].originFileObj;
  //     setProfileFile(selectedFile);
  //     const previewUrl = URL.createObjectURL(selectedFile);
  //     setProfilePreview(previewUrl);
  //   }
  // };

  // const handleProfileDelete = () => {
  //   setProfileURL('');
  //   setProfilePreview('');
  //   setProfileFile(null);
  // };

  // const handleCoverFileChange = (info: any) => {
  //   if (info.fileList.length > 0) {
  //     const selectedFile = info.fileList[0].originFileObj;
  //     setCoverFile(selectedFile);
  //     const previewUrl = URL.createObjectURL(selectedFile);
  //     setCoverPreview(previewUrl);
  //   }
  // };

  // const handleCoverDelete = () => {
  //   setCoverURL('');
  //   setCoverPreview('');
  //   setCoverFile(null);
  // };

  const handleSave = async (values: any) => {
    // Convert birth_date to exact local time
    if (values.birth_date) {
      values.birth_date = values.birth_date.format('YYYY-MM-DD HH:mm:ss');
    }

    // Convert death_date to exact local time
    if (values.death_date) {
      values.death_date = values.death_date.format('YYYY-MM-DD HH:mm:ss');
    }

    // Convert missing_since to exact local time
    if (values.missing_since) {
      values.missing_since = values.missing_since.format('YYYY-MM-DD HH:mm:ss');
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
        >
            <Input placeholder="Enter cat name" />
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
            label="Gender"
            name="gender"
          >
            <Select
              placeholder="Select gender"
              showSearch
              optionFilterProp="children"
              disabled={true}
              filterOption={(input, option) => {
                const label = option?.label || option?.children;
                return String(label).toLowerCase().includes(input.toLowerCase());
              }}
            >
              <Select.Option value="male">Male</Select.Option>
              <Select.Option value="female">Female</Select.Option>
            </Select>
        </Form.Item>

        <Form.Item
            label="Eye Color"
            name="eye_color"
          >
            <Select
              placeholder="Select eye color"
              loading={eyeColorLoading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const label = option?.label || option?.children;
                return String(label).toLowerCase().includes(input.toLowerCase());
              }}
            >
              {eyeColorOptions.map((color) => (
                <Select.Option key={color} value={color}>
                  {color}
                </Select.Option>
              ))}
            </Select>
        </Form.Item>

        <Form.Item
            label="Fur Color"
            name="fur_color"
        >
          <Select
              mode="multiple"
              placeholder="Select fur colors"
              loading={furColorLoading}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              const label = option?.label || option?.children;
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
          >
              {furColorOptions.map((color) => (
                <Select.Option key={color} value={color}>
                  {color}
              </Select.Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item
            label="Fur Pattern"
            name="fur_pattern"
        >
          <Select
              placeholder="Select fur pattern"
              loading={furPatternLoading}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              const label = option?.label || option?.children;
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
            >
              {furPatternOptions.map((pattern) => (
                <Select.Option key={pattern} value={pattern}>
                  {pattern}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

          <Form.Item
            label="Fur Length"
            name="fur_length"
          >
            <Select
              placeholder="Select fur length"
              loading={furLengthLoading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const label = option?.label || option?.children;
                return String(label).toLowerCase().includes(input.toLowerCase());
              }}
            >
              {furLengthOptions.map((length) => (
                <Select.Option key={length} value={length}>
                  {length}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <Input.TextArea
              placeholder="Enter any additional notes about the cat"
              rows={4}
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </div>

        {/* Lineage Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: mode === 'dark' ? '#ffffff' : '#000000',
            borderBottom: `2px solid ${mode === 'dark' ? '#434343' : '#d9d9d9'}`,
            paddingBottom: '8px'
          }}>
            Lineage
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

            <Form.Item
                label="Litter"
                name="litter_id"
            >
              <Select
                  placeholder="Unknown"
                  loading={littersLoading}
                  showSearch
                  optionFilterProp="children"
                  disabled={true}
                  filterOption={(input, option) => {
                    const label = option?.label || option?.children;
                    return String(label).toLowerCase().includes(input.toLowerCase());
                  }}
                >
                  {allLittersData?.data?.map((litter: any) => (
                    <Select.Option key={litter.id} value={litter.id}>
                      {litter.name || `Litter #${litter.id}`}
                    </Select.Option>
                  ))}
                </Select>
            </Form.Item>
        </div>

        {/* Status Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: mode === 'dark' ? '#ffffff' : '#000000',
            borderBottom: `2px solid ${mode === 'dark' ? '#434343' : '#d9d9d9'}`,
            paddingBottom: '8px'
          }}>
            Status
          </h3>
          
          <Form.Item
            name="status"
          >
            <Select
              placeholder="Select status"
              loading={statusLoading}
              showSearch
              optionFilterProp="children"
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value)}
              filterOption={(input, option) => {
                const label = option?.label || option?.children;
                return String(label).toLowerCase().includes(input.toLowerCase());
              }}
              style={{
                fontSize: '16px',
                fontWeight: '500',
                height: '48px',
                borderRadius: '8px',
                border: `2px solid ${mode === 'dark' ? '#434343' : '#d9d9d9'}`,
                backgroundColor: mode === 'dark' ? '#1f1f1f' : '#ffffff',
                color: mode === 'dark' ? '#ffffff' : '#000000',
              }}
              dropdownStyle={{
                backgroundColor: mode === 'dark' ? '#1f1f1f' : '#ffffff',
                border: `1px solid ${mode === 'dark' ? '#434343' : '#d9d9d9'}`,
                borderRadius: '8px',
                boxShadow: mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {statusOptions && statusOptions.length > 0 ? statusOptions.map((status) => (
                <Select.Option 
                  key={status} 
                  value={status}
                  style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: mode === 'dark' ? '#ffffff' : '#000000',
                    backgroundColor: mode === 'dark' ? '#1f1f1f' : '#ffffff',
                  }}
                >
                  {status}
                </Select.Option>
              )) : null}
            </Select>
          </Form.Item>

          {/* Conditional fields based on status */}
          {selectedStatus.toLowerCase().includes('dead') && (
            <Form.Item
              label="Death Date"
              name="death_date"
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
                placeholder="Select death date and time"
                style={{ width: "100%" }}
              />
            </Form.Item>
          )}

          {selectedStatus.toLowerCase().includes('missing') && (
            <Form.Item
              label="Missing Since"
              name="missing_since"
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
                placeholder="Select when cat went missing"
                style={{ width: "100%" }}
              />
            </Form.Item>
          )}
        </div>

        
        <style>
          {`
            .ant-switch-checked .ant-switch-handle::before {
              background-color: ${mode === "dark" ? "#141414" : "#ffffff"} !important;
            }
            .ant-switch-checked .ant-switch-inner-checked {
              color: ${mode === "dark" ? "#141414" : "#ffffff"} !important;
            }
              
          `}
        </style>
      </Form>
    </Edit>
  );
}; 