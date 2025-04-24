const { Sequelize, DataTypes } = require('sequelize');

// Kết nối database
const sequelize = new Sequelize('laptop_node', 'root', '', {  
  host: 'localhost',
  port:'3306',
  dialect: 'mysql'
});
;

// Model Loai
const LoaiModel = sequelize.define('loai', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ten_loai: { type: DataTypes.STRING, allowNull: false },
  thu_tu: { type: DataTypes.INTEGER, defaultValue: 0 },
  an_hien: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { timestamps: false, tableName: "loai" });

// Model SanPham
const SanPhamModel = sequelize.define('san_pham', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ten_sp: { type: DataTypes.STRING },
  ngay: { type: DataTypes.DATE },
  gia: { type: DataTypes.INTEGER },
  gia_km: { type: DataTypes.INTEGER },
  id_loai: { type: DataTypes.INTEGER },
  hot: { type: DataTypes.INTEGER },
  an_hien: { type: DataTypes.INTEGER },
  hinh: { type: DataTypes.STRING },
  tinh_chat: { type: DataTypes.INTEGER, defaultValue: 0 },
  luot_xem: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { timestamps: false, tableName: "san_pham" });
// model diễn tả cấu trúc  table don_hang
const DonHangModel = sequelize.define('don_hang', { 
  id_dh :{type:DataTypes.INTEGER ,primaryKey:true, autoIncrement:true }, 
  thoi_diem_mua: {type: DataTypes.DATE, defaultValue: new Date },
  ho_ten: { type: DataTypes.STRING }, 
  email: {type: DataTypes.STRING },
  ghi_chu: {type: DataTypes.STRING , defaultValue:""}
},
{ timestamps:false, tableName:"don_hang" }
);
// model diễn tả cấu trúc  table don_hang_chi_tiet
const DonHangChiTietModel = sequelize.define('don_hang_chi_tiet', { 
  id_ct :{type:DataTypes.INTEGER ,primaryKey:true, autoIncrement:true }, 
  id_dh: {type: DataTypes.INTEGER }, 
  id_sp: { type: DataTypes.INTEGER }, 
  so_luong: {type: DataTypes.INTEGER },
},
{ timestamps:false, tableName:"don_hang_chi_tiet" }
);
const UserModel = sequelize.define("users", {
  id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
  ho_ten: { type: DataTypes.STRING, allowNull: false,},
  email: { type: DataTypes.STRING, allowNull: false,},
  mat_khau: {type: DataTypes.STRING, allowNull:false},
  vai_tro: { type: DataTypes.INTEGER,defaultValue: 0,},
  khoa: { type: DataTypes.BOOLEAN,defaultValue: false,},
  remember_token: {type: DataTypes.STRING, allowNull:true},
  email_verified_at: {type: DataTypes.DATE, allowNull:true}
}, {
  tableName: "users", timestamps: false, // Không dùng createdAt, updatedAt
});

// Xuất module
module.exports = { sequelize, SanPhamModel, LoaiModel,DonHangModel, DonHangChiTietModel,UserModel};
