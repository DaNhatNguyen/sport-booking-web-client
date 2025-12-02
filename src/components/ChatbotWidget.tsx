import React, { useState, useRef, useEffect } from 'react';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Textarea,
  ScrollArea,
  rem,
} from '@mantine/core';
import {
  IconMessageCircle,
  IconRobot,
  IconSend,
  IconX,
} from '@tabler/icons-react';
import axios from 'axios';
import { getStoredUser } from '../services/authService';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const ChatbotWidget: React.FC = () => {
  const [opened, setOpened] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Xin chào! Mình là trợ lý đặt sân. Bạn có thể hỏi về giờ mở cửa, giá sân theo khung giờ, cách đặt sân, thanh toán, hoặc kiểm tra trạng thái đơn đặt.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: trimmed },
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const storedUser = getStoredUser() as any | null;
      const history = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await axios.post(
        `${API_BASE}/chatbot/query`,
        {
          message: trimmed,
          history,
          userContext: storedUser
            ? {
                userId: storedUser.id,
              }
            : null,
        },
        {
          headers: storedUser?.token
            ? {
                Authorization: storedUser.token,
              }
            : undefined,
        }
      );

      const answer =
        res?.data?.answer ??
        'Hiện tại mình chưa nhận được câu trả lời từ hệ thống, bạn thử lại sau nhé.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Có lỗi xảy ra khi kết nối tới máy chủ. Bạn kiểm tra lại kết nối hoặc thử lại sau ít phút nhé.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, opened]);

  return (
    <>
      {/* Nút nổi mở chatbot */}
      <Box
        style={{
          position: 'fixed',
          right: rem(24),
          bottom: rem(24),
          zIndex: 200,
        }}
      >
        {!opened && (
          <ActionIcon
            size={56}
            radius="xl"
            variant="filled"
            color="green"
            onClick={() => setOpened(true)}
          >
            <IconMessageCircle size={28} />
          </ActionIcon>
        )}
      </Box>

      {/* Hộp chat */}
      {opened && (
        <Box
          style={{
            position: 'fixed',
            right: rem(16),
            bottom: rem(16),
            width: '100%',
            maxWidth: 420,
            zIndex: 210,
          }}
        >
          <Paper shadow="lg" radius="md" withBorder p="sm">
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <Avatar radius="xl" color="green">
                  <IconRobot size={18} />
                </Avatar>
                <Stack gap={0}>
                  <Text fw={600} size="sm">
                    Trợ lý đặt sân
                  </Text>
                  <Text size="xs" c="dimmed">
                    Hỏi mình về giờ mở cửa, giá sân, thanh toán, đặt sân...
                  </Text>
                </Stack>
              </Group>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Đóng"
                onClick={() => setOpened(false)}
              >
                <IconX size={18} />
              </ActionIcon>
            </Group>

            <ScrollArea
              h={320}
              type="always"
              offsetScrollbars
              viewportRef={viewportRef}
              styles={{
                viewport: {
                  paddingRight: rem(4),
                },
              }}
            >
              <Stack gap="xs">
                {messages.map((msg, idx) => (
                  <Group
                    key={idx}
                    justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar radius="xl" size={28} color="green">
                        <IconRobot size={16} />
                      </Avatar>
                    )}
                    <Paper
                      radius="lg"
                      p="xs"
                      maw="80%"
                      style={{
                        backgroundColor:
                          msg.role === 'user' ? '#228be6' : '#f8f9fa',
                        color: msg.role === 'user' ? 'white' : 'inherit',
                      }}
                    >
                      <Text size="sm">{msg.content}</Text>
                    </Paper>
                  </Group>
                ))}
                {loading && (
                  <Group justify="flex-start">
                    <Avatar radius="xl" size={28} color="green">
                      <IconRobot size={16} />
                    </Avatar>
                    <Paper radius="lg" p="xs" maw="80%">
                      <Group gap={6}>
                        <Loader size="xs" />
                        <Text size="xs" c="dimmed">
                          Đang soạn câu trả lời...
                        </Text>
                      </Group>
                    </Paper>
                  </Group>
                )}
              </Stack>
            </ScrollArea>

            <Stack gap={6} mt="xs">
              <Textarea
                autosize
                minRows={2}
                maxRows={4}
                placeholder="Nhập câu hỏi của bạn (Enter để gửi, Shift + Enter để xuống dòng)..."
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
              />
              <Group justify="space-between" gap="xs">
                <Text size="xs" c="dimmed">
                  Gợi ý: &quot;Giờ mở cửa sân Thành Công?&quot;,
                  &quot;Giá sân cầu lông tối thứ 7&quot;...
                </Text>
                <Button
                  size="xs"
                  radius="xl"
                  rightSection={<IconSend size={14} />}
                  onClick={sendMessage}
                  loading={loading}
                  disabled={!input.trim()}
                >
                  Gửi
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Box>
      )}
    </>
  );
};

export default ChatbotWidget;



