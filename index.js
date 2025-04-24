const express = require("express");
var app = express(); //tạo ứng dụng nodejs
const port = 3000;
app.use(express.json()); //cho phép đọc dữ liệu dạng json
const cors = require("cors");
app.use(cors()); //cho phép mọi nguồi bên ngoài request đến ứnd dụng
const {
  SanPhamModel,
  LoaiModel,
  DonHangModel,
  DonHangChiTietModel,
} = require("./database"); //các model lấy database
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

// Cấu hình multer lưu file vào "uploads"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Lưu file vào thư mục "uploads"
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // tên file
  },
});

const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.json({ thongbao: "Không có file" });
  const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

const { Op } = require("sequelize");

app.get("/api/timkiem/:tu_khoa/:page?", async (req, res) => {
  let tu_khoa = req.params.tu_khoa;
  const page = Number(req.params.page) || 1;
  const sp_arr = await SanPhamModel.findAll({
    where: {
      ten_sp: { [Op.substring]: `%${tu_khoa}%` },
      an_hien: 1,
    },
    order: [
      ["ngay", "DESC"],
      ["gia", "ASC"],
    ],
  });
  res.json(sp_arr);
});

app.get("/api/loai", async (req, res) => {
  const loai_arr = await LoaiModel.findAll({
    where: { an_hien: 1 },
    order: [["thu_tu", "ASC"]],
  });
  res.json(loai_arr);
});
app.get("/api/loai/:id", async (req, res) => {
  const loai = await LoaiModel.findByPk(req.params.id);
  res.json(loai);
});
app.get("/api/sanpham", async (req, res) => {
  const sanpham_arr = await SanPhamModel.findAll({
    where: { an_hien: 1 },
    order: [["id", "DESC"]],
  });
  res.json(sanpham_arr);
});

app.get("/api/sphot/:sosp?", async (req, res) => {
  const sosp = Number(req.params.sosp) || 12;
  const sp_arr = await SanPhamModel.findAll({
    where: { an_hien: 1, hot: 1 },
    order: [
      ["ngay", "DESC"],
      ["gia", "ASC"],
    ],
    offset: 0,
    limit: sosp,
  });
  res.json(sp_arr);
});
app.get("/api/spmoi/:sosp?", async (req, res) => {
  const sosp = Number(req.params.sosp) || 6;
  const sp_arr = await SanPhamModel.findAll({
    where: { an_hien: 1 },
    order: [
      ["ngay", "DESC"],
      ["gia", "ASC"],
    ],
    offset: 0,
    limit: sosp,
  });
  res.json(sp_arr);
});
app.get("/api/sp/:id", async (req, res) => {
  const id = Number(req.params.id);
  const sp = await SanPhamModel.findOne({
    where: { id: id },
  });
  res.json(sp);
});
app.get("/api/sptrongloai/:id", async (req, res) => {
  const id_loai = Number(req.params.id);
  const sp_arr = await SanPhamModel.findAll({
    where: { id_loai: id_loai, an_hien: 1 },
    order: [
      ["ngay", "DESC"],
      ["gia", "ASC"],
    ],
  });
  res.json(sp_arr);
});

import("chalk").then((chalk) => {
  app
    .listen(port, () => {
      console.log(
        chalk.default.green.bold("✔ Ứng dụng đang chạy tại:") +
          chalk.default.cyan.underline(` http://localhost:${port}`)
      );
    })
    .on("error", function (err) {
      console.log(
        chalk.default.red.bold("✖ Lỗi xảy ra: ") +
          chalk.default.yellow(err.message)
      );
    });
});

app.post("/api/luudonhang/", async (req, res) => {
  let { ho_ten, email, ghi_chu } = req.body;
  await DonHangModel.create({
    ho_ten: ho_ten,
    email: email,
    ghi_chu: ghi_chu,
  })
    .then(function (item) {
      res.json({ thong_bao: "Đã tạo đơn hàng", dh: item });
    })
    .catch(function (err) {
      res.json({ thong_bao: "Lỗi tạo đơn hàng", err });
    });
});

// app.post('/api/luugiohang/', async (req, res) => {
//   let { id_dh, id_sp, so_luong } = req.body
//   await DonHangChiTietModel.create({
//       id_dh: id_dh, id_sp: id_sp, so_luong: so_luong
//   })
//   .then(function(item) {
//       res.json({ "thong_bao": "Đã lưu giỏ hàng", "sp": item });
//   })
//   .catch(function(err) {
//       res.json({ "thong_bao": "Lỗi lưu giỏ hàng", err });
//   });
// });

const { UserModel } = require("./database");
app.post(`/api/dangnhap`, async (req, res) => {
  const { email, mat_khau } = req.body;

  const user = await UserModel.findOne({ where: { email: email } });
  if (!user) {
    return res.status(401).json({ thong_bao: "Email không tồn tại" });
  }

  // Kiểm tra trạng thái kích hoạt
  if (!user.email_verified_at) {
    return res.status(401).json({ thong_bao: "Tài khoản chưa được kích hoạt" });
  }

  const isPasswordCorrect = bcrypt.compareSync(mat_khau, user.mat_khau);
  if (!isPasswordCorrect) {
    return res.status(401).json({ thong_bao: "Mật khẩu không đúng" });
  }

  if (user.khoa) {
    return res.status(401).json({ thong_bao: "Tài khoản bị khóa" });
  }

  // Tạo token JWT
  const PRIVATE_KEY =
    process.env.JWT_PRIVATE_KEY || fs.readFileSync("private-key.txt");
  const payload = {
    id: user.id,
    email: user.email,
    vai_tro: user.vai_tro,
  };
  const maxAge = "1h";
  const token = jwt.sign(payload, PRIVATE_KEY, {
    expiresIn: maxAge,
    subject: user.id + "",
  });

  res.status(200).json({
    token: token,
    expiresIn: maxAge,
    thong_bao: "Đăng nhập thành công",
    info: {
      id: user.id,
      ho_ten: user.ho_ten,
      email: user.email,
      vai_tro: user.vai_tro,
    },
  });
});
app.post("/api/dangky", async (req, res) => {
  let { ho_ten, email, mat_khau, go_lai_mat_khau, vai_tro } = req.body;

  const user = await UserModel.findOne({ where: { email: email } });
  if (user !== null) {
    return res.status(401).json({ thong_bao: "Email đã tồn tại" });
  }

  if (mat_khau === undefined || mat_khau.length < 6) {
    return res.status(401).json({ thong_bao: "Mật khẩu phải > 6 ký tự" });
  }
  if (mat_khau !== go_lai_mat_khau) {
    return res.status(401).json({ thong_bao: "Hai mật khẩu không giống" });
  }

  const bcrypt = require("bcryptjs");
  const mk_mahoa = await bcrypt.hash(mat_khau, 10);

  const { v4: uuidv4 } = require("uuid");
  const token = uuidv4();

  const u = await UserModel.create({
    ho_ten,
    email,
    mat_khau: mk_mahoa,
    remember_token: token,
    vai_tro,
  });

  const linkKichHoat = `http://localhost:3000/api/kichhoat?token=${token}`;

  // const nodemailer = require('nodemailer');
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "vominhquann2005@gmail.com", //đay là email của bạn và mạt khẩu để gửi cho người đăng ký
      pass: "ksgp laut pyla ecik",
    },
  });

  const mailOptions = {
    from: "emailcuban@gmail.com",
    to: email,
    subject: "Xác nhận tài khoản",
    html: `
      <h2>Chào ${ho_ten},</h2>
      <p>Bạn vừa đăng ký tài khoản, vui lòng xác thực tài khoản:</p>
      <a href="${linkKichHoat}" style="padding: 10px 20px; background: #28a745; color: #fff; text-decoration: none; border-radius: 5px;">Kích hoạt tài khoản</a>
      <p>Nếu bạn không đăng ký, vui lòng bỏ qua email này.</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Lỗi gửi mail:", error);
      return res
        .status(500)
        .json({ thong_bao: "Đăng ký thất bại: lỗi gửi email" });
    }

    console.log("Email gửi thành công! ID:", info.messageId);
    return res.status(200).json({ thong_bao: "Đăng ký thành công", u });
  });

  // Trả về phản hồi
  res
    .status(200)
    .json({
      thong_bao:
        "Đăng ký thành công, vui lòng kiểm tra email để kích hoạt tài khoản.",
    });
});

app.post(`/api/quenpass`, async (req, res) => {
  let { email } = req.body;
  const user = await UserModel.findOne({ where: { email: email } });
  if (user === null)
    return res.status(401).json({ thong_bao: "Email không tồn tại" });
  let newPass;
  do {
    const strRandom = Math.random().toString(36); //0.6oj656mc6ud
    newPass = strRandom.slice(-8); //656mc6ud
  } while (newPass.length < 8);
  const bcrypt = require("bcryptjs");
  const mk_mahoa = await bcrypt.hash(newPass, 10);
  await user.update({ mat_khau: mk_mahoa });
  //Gửi mail
  res.status(200).json({ thong_bao: `Đã cập nhật mật khẩu: ${newPass}` });
});
app.post("/api/doipass", async (req, res) => {
  let { pass_old, pass_new1, pass_new2 } = req.body;
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(403).json({ thong_bao: "Token không hợp lệ" });

  const token = authHeader.split(" ")[1];
  const fs = require("fs");
  let private_key = fs.readFileSync("private-key.txt");
  const jwt = require("jsonwebtoken");

  let decoded;
  try {
    decoded = jwt.verify(token, private_key);
  } catch (err) {
    return res.status(403).json({ thong_bao: "Token hết hạn hoặc ko hợp lệ" });
  }

  let id = decoded.id;
  const user = await UserModel.findByPk(id);
  let mk_trongdb = user.mat_khau;
  const bcrypt = require("bcryptjs");

  let kq = bcrypt.compareSync(pass_old, mk_trongdb);
  if (kq == false)
    return res.status(403).json({ thong_bao: "Mật khẩu cũ không đúng" });

  if (pass_new1 !== "" && pass_new1 !== pass_new2) {
    return res.json({ thong_bao: "Hai mật khẩu mới không khớp" });
  }

  const salt = bcrypt.genSaltSync(10);
  let mk_mahoa = bcrypt.hashSync(pass_new1, salt);

  await UserModel.update({ mat_khau: mk_mahoa }, { where: { id: id } });

  res.status(200).json({ thong_bao: "Đã cập nhật" });
});
app.get("/api/kichhoat", async (req, res) => {
  const { token } = req.query;
  const user = await UserModel.findOne({ where: { remember_token: token } });
  if (!user) {
    return res
      .status(400)
      .json({ thong_bao: "Token không hợp lệ hoặc đã sử dụng" });
  }
  user.email_verified_at = new Date();
  user.remember_token = null;
  await user.save();
  res.json({ thong_bao: "Tài khoản đã kích hoạt!" });
});

// Lấy danh sách user (hiển thị user có trạng thái hoạt động)
app.get("/api/user", async (req, res) => {
  const users = await UserModel.findAll({
    where: { trang_thai: 1 }, // hoặc field khác tùy model của bạn
    order: [["id", "ASC"]],
  });
  res.json(users);
});

app.get("/api/user/:id", async (req, res) => {
  const user = await UserModel.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ thong_bao: "Không tìm thấy người dùng" });
  }
  res.json(user);
});
// Ví dụ Node.js (Express hoặc Next API route)
app.put("/admin/admin-user/api/user/:id", (req, res) => {
  const { id } = req.params;
  const { khoa } = req.body;

  // Cập nhật trong file/data
  // Sau đó trả về
  res.status(200).json({ message: "Cập nhật thành công" });
});

//Đơn hàng admin
app.get("/api/don_hang", async (req, res) => {
  try {
    const orders = await DonHangModel.findAll();
    res.json(orders);
  } catch (err) {
    res.json({ thong_bao: "Lỗi khi lấy đơn hàng", err });
  }
});
app.get("/api/don_hang_chi_tiet/:id_dh", async (req, res) => {
  let { id_dh } = req.params;
  try {
    const orderDetails = await DonHangChiTietModel.findAll({
      where: { id_dh: id_dh },
    });
    res.json(orderDetails);
  } catch (err) {
    res.json({ thong_bao: "Lỗi khi lấy chi tiết đơn hàng", err });
  }
});

app.post("/api/luugiohang/", async (req, res) => {
  let { id_dh, id_sp, so_luong } = req.body;
  try {
    const existingItem = await DonHangChiTietModel.findOne({
      where: { id_dh: id_dh, id_sp: id_sp },
    });

    if (existingItem) {
      // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
      existingItem.so_luong += so_luong;
      await existingItem.save();
      res.json({
        thong_bao: "Sản phẩm đã được cập nhật trong giỏ hàng",
        sp: existingItem,
      });
    } else {
      // Nếu sản phẩm chưa có trong giỏ hàng, tạo mới
      const newItem = await DonHangChiTietModel.create({
        id_dh: id_dh,
        id_sp: id_sp,
        so_luong: so_luong,
      });
      res.json({ thong_bao: "Đã lưu giỏ hàng", sp: newItem });
    }
  } catch (err) {
    res.json({ thong_bao: "Lỗi lưu giỏ hàng", err });
  }
});

app.put("/api/don_hang/:id", async (req, res) => {
  const { id } = req.params;
  const { trang_thai } = req.body;
  try {
    const order = await DonHangModel.findByPk(id);
    if (order) {
      order.trang_thai = trang_thai;
      await order.save();
      res.json({
        thong_bao: "Cập nhật trạng thái đơn hàng thành công",
        dh: order,
      });
    } else {
      res.json({ thong_bao: "Đơn hàng không tồn tại" });
    }
  } catch (err) {
    res.json({ thong_bao: "Lỗi khi cập nhật trạng thái đơn hàng", err });
  }
});

app.get("/api/sanpham-giare", async (req, res) => {
  try {
    const spGiaRe = await SanPhamModel.findAll({
      where: { gia_km: { [Op.lt]: 15000000 } },
      limit: 15,
    });
    res.json(spGiaRe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi lấy sản phẩm" });
  }
});

// Route chi tiết sp theo id
app.get("/api/sanpham/:id", async (req, res) => {
  try {
    const sp = await SanPhamModel.findByPk(req.params.id);
    if (!sp) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    res.json(sp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi lấy chi tiết sản phẩm" });
  }
});
