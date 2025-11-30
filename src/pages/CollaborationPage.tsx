import React, { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Grid,
  FileInput,
  Select,
  Image,
  Group,
  Box,
  Stepper,
  Alert,
  List,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconUser,
  IconMail,
  IconPhone,
  IconLock,
  IconUpload,
  IconBuildingBank,
  IconAlertCircle,
  IconCheck,
  IconCreditCard,
  IconFileUpload,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { registerOwner } from '../services/authService';

interface OwnerRegistrationForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

const BANK_LIST = [
  'Vietcombank',
  'BIDV',
  'Vietinbank',
  'Agribank',
  'Techcombank',
  'MB Bank',
  'ACB',
  'VPBank',
  'TPBank',
  'Sacombank',
  'HDBank',
  'VIB',
  'SHB',
  'OCB',
  'MSB',
  'SeABank',
  'VietCapital Bank',
  'BacA Bank',
  'PVcomBank',
  'Oceanbank',
  'NCB',
  'BVBank',
  'Cake Bank',
  'Timo',
];

const CollaborationPage: React.FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Files
  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [bankQrImage, setBankQrImage] = useState<File | null>(null);

  const form = useForm<OwnerRegistrationForm>({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      bankName: '',
      bankAccountNumber: '',
      bankAccountName: '',
    },
    validate: (values) => {
      if (active === 0) {
        return {
          fullName: values.fullName.trim().length < 3 ? 'Họ tên phải có ít nhất 3 ký tự' : null,
          email: /^\S+@\S+$/.test(values.email) ? null : 'Email không hợp lệ',
          password: values.password.length < 6 ? 'Mật khẩu phải có ít nhất 6 ký tự' : null,
          confirmPassword:
            values.password !== values.confirmPassword ? 'Mật khẩu không khớp' : null,
          phone: /^[0-9]{10}$/.test(values.phone) ? null : 'Số điện thoại không hợp lệ',
        };
      }

      if (active === 1) {
        return {
          bankName: values.bankName ? null : 'Vui lòng chọn ngân hàng',
          bankAccountNumber:
            values.bankAccountNumber.trim().length > 0 ? null : 'Vui lòng nhập số tài khoản',
          bankAccountName:
            values.bankAccountName.trim().length > 0 ? null : 'Vui lòng nhập tên chủ tài khoản',
        };
      }

      return {};
    },
  });

  const nextStep = () => {
    const validation = form.validate();
    if (!validation.hasErrors) {
      setActive((current) => (current >= 2 ? 3 : current + 1));
    }
  };

  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const handleSubmit = async () => {
    // Validate step 2 (documents)
    if (!idCardFront || !idCardBack) {
      notifications.show({
        title: 'Thiếu thông tin',
        message: 'Vui lòng tải lên ảnh CMND/CCCD cả 2 mặt',
        color: 'yellow',
        icon: <IconAlertCircle />,
      });
      return;
    }

    try {
      setSubmitting(true);

      // Create FormData
      const formData = new FormData();
      formData.append('fullName', form.values.fullName);
      formData.append('email', form.values.email);
      formData.append('password', form.values.password);
      formData.append('phone', form.values.phone);
      formData.append('bankName', form.values.bankName);
      formData.append('bankAccountNumber', form.values.bankAccountNumber);
      formData.append('bankAccountName', form.values.bankAccountName);
      formData.append('idCardFront', idCardFront);
      formData.append('idCardBack', idCardBack);
      if (bankQrImage) {
        formData.append('bankQrImage', bankQrImage);
      }

      await registerOwner(formData);

      notifications.show({
        title: 'Đăng ký thành công!',
        message:
          'Đơn đăng ký của bạn đã được gửi. Vui chờ và kiểm tra trạng thái trên trang quản trị!.',
        color: 'green',
        icon: <IconCheck />,
        autoClose: 5000,
      });

      // Navigate to login page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      console.error('Error registering owner:', error);
      notifications.show({
        title: 'Lỗi',
        message: error?.response?.data?.message || 'Không thể đăng ký. Vui lòng thử lại sau.',
        color: 'red',
        icon: <IconAlertCircle />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <Container size="lg" py="xl">
        <Paper shadow="md" p="xl" radius="md">
          <Title order={2} ta="center" mb="md">
            Đăng ký trở thành đối tác
          </Title>
          <Text ta="center" c="dimmed" mb="xl">
            Đăng ký để quản lý và cho thuê sân thể thao của bạn
          </Text>

          <Stepper active={active} onStepClick={setActive} mb="xl">
            <Stepper.Step
              label="Bước 1"
              description="Thông tin cá nhân"
              icon={<IconUser size={18} />}
            >
              <Stack gap="md" mt="xl">
                <TextInput
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  leftSection={<IconUser size={16} />}
                  required
                  {...form.getInputProps('fullName')}
                />

                <TextInput
                  label="Email"
                  placeholder="example@email.com"
                  leftSection={<IconMail size={16} />}
                  required
                  {...form.getInputProps('email')}
                />

                <TextInput
                  label="Số điện thoại"
                  placeholder="0123456789"
                  leftSection={<IconPhone size={16} />}
                  required
                  {...form.getInputProps('phone')}
                />

                <PasswordInput
                  label="Mật khẩu"
                  placeholder="Tối thiểu 6 ký tự"
                  leftSection={<IconLock size={16} />}
                  required
                  {...form.getInputProps('password')}
                />

                <PasswordInput
                  label="Xác nhận mật khẩu"
                  placeholder="Nhập lại mật khẩu"
                  leftSection={<IconLock size={16} />}
                  required
                  {...form.getInputProps('confirmPassword')}
                />
              </Stack>
            </Stepper.Step>

            <Stepper.Step
              label="Bước 2"
              description="Thông tin ngân hàng"
              icon={<IconBuildingBank size={18} />}
            >
              <Stack gap="md" mt="xl">
                <Alert icon={<IconAlertCircle />} title="Lưu ý" color="blue">
                  Thông tin ngân hàng sẽ được sử dụng để nhận thanh toán từ khách hàng khi đặt sân.
                </Alert>

                <Select
                  label="Ngân hàng"
                  placeholder="Chọn ngân hàng"
                  leftSection={<IconBuildingBank size={16} />}
                  data={BANK_LIST}
                  searchable
                  required
                  {...form.getInputProps('bankName')}
                />

                <TextInput
                  label="Số tài khoản"
                  placeholder="1234567890"
                  leftSection={<IconCreditCard size={16} />}
                  required
                  {...form.getInputProps('bankAccountNumber')}
                />

                <TextInput
                  label="Tên chủ tài khoản"
                  placeholder="NGUYEN VAN A"
                  description="Nhập chính xác như trên thẻ (in hoa, không dấu)"
                  required
                  {...form.getInputProps('bankAccountName')}
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) =>
                    form.setFieldValue('bankAccountName', e.target.value.toUpperCase())
                  }
                />

                <FileInput
                  label="Ảnh QR Code ngân hàng (Không bắt buộc)"
                  placeholder="Chọn ảnh QR code"
                  leftSection={<IconUpload size={16} />}
                  accept="image/*"
                  value={bankQrImage}
                  onChange={setBankQrImage}
                  description="Khách hàng có thể quét mã QR để thanh toán nhanh hơn"
                />

                {bankQrImage && (
                  <Box>
                    <Text size="sm" fw={500} mb="xs">
                      Xem trước QR Code:
                    </Text>
                    <Image
                      src={URL.createObjectURL(bankQrImage)}
                      alt="Bank QR preview"
                      radius="md"
                      h={200}
                      fit="contain"
                    />
                  </Box>
                )}
              </Stack>
            </Stepper.Step>

            <Stepper.Step
              label="Bước 3"
              description="Giấy tờ xác thực"
              icon={<IconFileUpload size={18} />}
            >
              <Stack gap="md" mt="xl">
                <Alert icon={<IconAlertCircle />} title="Yêu cầu" color="blue">
                  <List size="sm">
                    <List.Item>Vui lòng tải lên ảnh CMND/CCCD hoặc Hộ chiếu cả 2 mặt</List.Item>
                    <List.Item>Ảnh phải rõ nét, không bị mờ hoặc che khuất</List.Item>
                    <List.Item>Thông tin trên giấy tờ phải khớp với thông tin đăng ký</List.Item>
                  </List>
                </Alert>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <FileInput
                      label="Mặt trước CMND/CCCD"
                      placeholder="Chọn ảnh"
                      leftSection={<IconUpload size={16} />}
                      accept="image/*"
                      value={idCardFront}
                      onChange={setIdCardFront}
                      required
                    />
                    {idCardFront && (
                      <Box mt="md">
                        <Text size="sm" fw={500} mb="xs">
                          Xem trước:
                        </Text>
                        <Image
                          src={URL.createObjectURL(idCardFront)}
                          alt="ID card front"
                          radius="md"
                          h={150}
                          fit="contain"
                        />
                      </Box>
                    )}
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <FileInput
                      label="Mặt sau CMND/CCCD"
                      placeholder="Chọn ảnh"
                      leftSection={<IconUpload size={16} />}
                      accept="image/*"
                      value={idCardBack}
                      onChange={setIdCardBack}
                      required
                    />
                    {idCardBack && (
                      <Box mt="md">
                        <Text size="sm" fw={500} mb="xs">
                          Xem trước:
                        </Text>
                        <Image
                          src={URL.createObjectURL(idCardBack)}
                          alt="ID card back"
                          radius="md"
                          h={150}
                          fit="contain"
                        />
                      </Box>
                    )}
                  </Grid.Col>
                </Grid>
              </Stack>
            </Stepper.Step>

            <Stepper.Completed>
              <Stack align="center" gap="md" mt="xl">
                <IconCheck size={60} color="green" />
                <Title order={3}>Sẵn sàng gửi đơn đăng ký!</Title>
                <Text ta="center" c="dimmed">
                  Sau khi gửi đơn, chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.
                  <br />
                  Bạn sẽ nhận được email thông báo khi đơn được duyệt.
                </Text>

                <Alert icon={<IconAlertCircle />} title="Quy trình phê duyệt" color="blue">
                  <List size="sm">
                    <List.Item>Bước 1: Admin xem xét thông tin và giấy tờ</List.Item>
                    <List.Item>Bước 2: Xác minh thông tin ngân hàng</List.Item>
                    <List.Item>Bước 3: Kích hoạt tài khoản và gửi email thông báo</List.Item>
                    <List.Item>
                      Sau khi được duyệt, bạn có thể đăng nhập và bắt đầu đăng sân
                    </List.Item>
                  </List>
                </Alert>

                <Button
                  size="lg"
                  onClick={handleSubmit}
                  loading={submitting}
                  leftSection={<IconCheck size={18} />}
                >
                  Gửi đơn đăng ký
                </Button>
              </Stack>
            </Stepper.Completed>
          </Stepper>

          {active < 3 && (
            <Group justify="space-between" mt="xl">
              <Button variant="default" onClick={prevStep} disabled={active === 0}>
                Quay lại
              </Button>
              <Button onClick={nextStep}>{active === 2 ? 'Xem lại' : 'Tiếp tục'}</Button>
            </Group>
          )}
        </Paper>

        {/* Info section */}
        <Paper shadow="sm" p="xl" mt="xl" radius="md">
          <Title order={3} mb="md">
            Lợi ích khi trở thành đối tác
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="xs">
                <Text fw={600} size="lg">
                  📈 Tăng doanh thu
                </Text>
                <Text size="sm" c="dimmed">
                  Tiếp cận hàng ngàn khách hàng tiềm năng trên nền tảng
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="xs">
                <Text fw={600} size="lg">
                  💰 Thanh toán nhanh chóng
                </Text>
                <Text size="sm" c="dimmed">
                  Hệ thống thanh toán tự động, nhận tiền ngay sau khi khách đặt sân
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="xs">
                <Text fw={600} size="lg">
                  📊 Quản lý dễ dàng
                </Text>
                <Text size="sm" c="dimmed">
                  Dashboard trực quan, theo dõi lịch đặt và doanh thu theo thời gian thực
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>
      </Container>
      <Footer />
    </>
  );
};

export default CollaborationPage;
