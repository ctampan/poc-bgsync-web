"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { Data, DataBody } from "@/types/DataType";
import { firestore, FirestoreTimestamp } from "@/configs/firebase";
import {
  Alert,
  App,
  Button,
  Col,
  ConfigProvider,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Spin,
  Table,
} from "antd";
import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";
import { useForm } from "antd/es/form/Form";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { unique } from "radash";

const senderAtom = atomWithStorage("sender", "");

const lastSendAtom = atomWithStorage<DataBody | null>("lastSend", null);

export default function Home() {
  return (
    <ConfigProvider>
      <App>
        <HomeComponent />
      </App>
    </ConfigProvider>
  );
}

function HomeComponent() {
  const { message } = App.useApp();

  const [isLoading, setLoading] = useState(true);
  const [datas, setDatas] = useState<Data[]>([]);
  const [sender, setSender] = useAtom(senderAtom);
  const [form] = useForm();

  const [queue, setQueue] = useState<DataBody[]>([]);
  const [currentData, setCurrentData] = useState<DataBody | null>();

  const [lastSend, setLastSend] = useAtom(lastSendAtom);

  useEffect(() => {
    const unsubscribe = firestore.collection("data").onSnapshot((snapshot) => {
      const _datas: Data[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Data[];

      _datas.sort(
        (a, b) => b.timestampServer.seconds - a.timestampServer.seconds
      );

      setDatas(_datas);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentData && queue.length > 0) {
      handleAddData(queue[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, currentData]);

  const handleAddData = async (dataToSend: DataBody) => {
    const _currentData: DataBody = {
      ...dataToSend,
      timestampClient: new Date(),
    };

    setCurrentData(_currentData);

    const result = await fetch("/api/add-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ..._currentData,
        timestampClient: _currentData.timestampClient,
      }),
      keepalive: true,
    });

    if (result.status >= 200 && result.status < 300) {
      message.success(`Successfully adding ${JSON.stringify(_currentData)}`);
      setLastSend(_currentData);
    } else {
      message.error(`Fail to add ${JSON.stringify(_currentData)}`);
    }

    setQueue((prev) => prev.slice(1));
    setCurrentData(null);
  };

  const onFinish = ({
    datas,
  }: {
    datas: { message: string; sleepMs: number }[];
  }) => {
    setQueue(
      datas.map((data) => ({
        sender,
        message: data.message,
        sleepMs: data.sleepMs,
        timestampClient: new Date(),
      }))
    );
    form.resetFields();
  };

  return (
    <main className={styles.main}>
      {isLoading ? (
        <div>loading...</div>
      ) : (
        <div>
          <Table
            pagination={{
              defaultPageSize: 5,
              pageSizeOptions: [5, 10, 15],
              showSizeChanger: true,
            }}
            scroll={{ x: true }}
            columns={[
              { title: "Message", dataIndex: "message" },
              {
                title: "Sender",
                dataIndex: "sender",
                filters: unique(datas.map((data) => data.sender)).map((s) => ({
                  text: s,
                  value: s,
                })),
                onFilter: (value, record) => value === record.sender,
              },
              {
                title: "Client Timestamp",
                dataIndex: "timestampClient",
                render: (value) => (value.toDate() as Date).toISOString(),
              },
              {
                title: "Server Timestamp",
                dataIndex: "timestampServer",
                render: (value) => (value.toDate() as Date).toISOString(),
              },
              {
                title: "Delay",
                dataIndex: "sleepMs",
                render: (value) => `${value} ms`,
              },
            ]}
            rowKey={"id"}
            dataSource={datas}
          />
          <Divider />
          {queue.length > 0 && (
            <>
              <Alert
                showIcon
                icon={<Spin />}
                message={`Processing ${queue.length} API call${
                  queue.length > 1 ? "s" : ""
                }`}
                description={`Current body: ${JSON.stringify(currentData)}`}
                type="info"
              />
              <Divider />
            </>
          )}
          {lastSend && (
            <>
              <Alert
                type="info"
                message="This is the last successfully sent body from this browser"
                description={JSON.stringify(lastSend)}
              />
              <Divider />
            </>
          )}
          <div>
            <Form
              form={form}
              name="dynamic_form_nest_item"
              onFinish={onFinish}
              style={{ maxWidth: 600 }}
              autoComplete="off"
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                label={<div className={styles["form-label"]}>Sender Name</div>}
              >
                <Input
                  placeholder="Input sender name"
                  onChange={(e) => setSender(e.target.value)}
                  value={sender}
                />
              </Form.Item>
              <Form.List name="datas">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row
                        key={key}
                        style={{
                          display: "flex",
                        }}
                        gutter={10}
                      >
                        <Col xs={11}>
                          <Form.Item
                            label={
                              key === 0 && (
                                <div className={styles["form-label"]}>
                                  Message
                                </div>
                              )
                            }
                            {...restField}
                            name={[name, "message"]}
                            rules={[
                              { required: true, message: "Missing message" },
                            ]}
                          >
                            <Input placeholder="Message" />
                          </Form.Item>
                        </Col>
                        <Col xs={11}>
                          <Form.Item
                            label={
                              key === 0 && (
                                <div className={styles["form-label"]}>
                                  API Delay
                                </div>
                              )
                            }
                            {...restField}
                            name={[name, "sleepMs"]}
                            rules={[
                              { required: true, message: "Missing delay" },
                            ]}
                            initialValue={1000}
                          >
                            <InputNumber
                              placeholder="API delay"
                              min={0}
                              step={100}
                              changeOnWheel
                              addonAfter={
                                <div style={{ color: "white" }}>ms</div>
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col
                          xs={2}
                          style={{
                            display: "flex",
                            alignItems: "end",
                            justifyContent: "center",
                          }}
                        >
                          <MinusCircleOutlined
                            className={styles["minus-icon"]}
                            onClick={() => remove(name)}
                          />
                        </Col>
                      </Row>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        Add field
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Send
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      )}
    </main>
  );
}
