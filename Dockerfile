# Sử dụng image Node.js chính thức
FROM node:22

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép file package và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn server
COPY . .

# Expose port của server
EXPOSE 3000

# Khởi động ứng dụng
CMD ["node", "index.js"]