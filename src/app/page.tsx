// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, 
  MessageCircle, 
  ArrowRight, 
  MapPin,
  Clock,
  Shield,
  ExternalLink,
  Menu,
  X,
  Filter
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const ImageSlider = ({ images, alt, condition }: { images: string[], alt: string, condition: string }) => {
  const [current, setCurrent] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const goTo = (i: number, e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    setCurrent(i);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDragStart(e.clientX);
    setDragging(false);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart !== null && Math.abs(e.clientX - dragStart) > 8) setDragging(true);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart === null) return;
    const diff = dragStart - e.clientX;
    if (Math.abs(diff) > 40) {
      e.preventDefault();
      diff > 0
        ? setCurrent(c => (c + 1) % images.length)
        : setCurrent(c => (c - 1 + images.length) % images.length);
    }
    setDragStart(null);
  };
  const onClick = (e: React.MouseEvent) => {
    if (dragging) e.preventDefault();
  };

  return (
    <div className="aspect-[3/4] md:aspect-[4/5] relative overflow-hidden bg-[#0A0A0A] cursor-grab active:cursor-grabbing select-none touch-pan-y"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onClick={onClick}>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10 pointer-events-none" />
      <img src={images[current]} alt={alt} draggable={false} className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none" />
      {condition !== "–" && (
        <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-[#0A0A0A]/80 backdrop-blur text-xs uppercase tracking-widest border border-[#FF4400] text-[#FF4400] pointer-events-none">
          {condition}
        </div>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
          {images.map((_, i) => (
            <button key={i} onClick={(e) => goTo(i, e)}
              className={`rounded-full transition-all duration-200 ${i === current ? 'bg-[#FF4400] w-5 h-2.5' : 'bg-white/40 hover:bg-white/70 w-2.5 h-2.5'}`} />
          ))}
        </div>
      )}
    </div>
  );
};

const products = [
  {
    id: 1,
    name: "The North Face Pufferjacke",
    category: "Jacken",
    price: "€42",
    size: "L",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/01_01a1a_PD6Trf4ARHNYjDcC4aYXdKYm/f800/1772736752.webp?s=636466168eff9afa78b1c32ef10e833a86c8fc9d",
        "https://images1.vinted.net/t/04_00899_A1jDRJDF5n3KaFLqt949QNPS/f800/1772736752.webp?s=c89e8f88296ef9edc721fa19d6a4a894953e9b3c",
        "https://images1.vinted.net/t/01_01bbc_D28Mhc82LBh83oAMb7YCJdfZ/f800/1772736753.webp?s=9b27c265770c83460dc4f962003ba56ad056a208",
        "https://images1.vinted.net/t/05_01600_Wfw7L3WSkpU35n8z3rkB9vis/f800/1772736753.webp?s=6e32a90a2d3232420f392205f8abe2f68b5caebe",
        "https://images1.vinted.net/t/06_017fb_MXKhQ9mDCQ2WHrx4RaZWTsFz/f800/1772736753.webp?s=5dc6e06ceb3ecbde7dc20b508726a4639cd1d808"
      ],
    vintedUrl: "https://www.vinted.de/items/8322236551"
  },
  {
    id: 2,
    name: "Lacoste Track Jacket Windbreaker",
    category: "Jacken",
    price: "€49",
    size: "M",
    condition: "Sehr gut",
    images: [
        "https://images1.vinted.net/t/03_0231e_QGGDXtYBsigJX29VaVt7m9TN/f800/1773579801.webp?s=fc915e5f5a759d5d414adb1d7bab3018951f0cfd",
        "https://images1.vinted.net/t/06_005b4_d9pGeLCm39dCPm5dpwXkHySk/f800/1773579801.webp?s=6a2d676023974d36c9f5f65c0748587043853969",
        "https://images1.vinted.net/t/06_0165e_a5U6rnocthtWJbWwN9QAWnaL/f800/1773579801.webp?s=b235d88195073c91a5c1efd2175e74f1e3575b12",
        "https://images1.vinted.net/t/01_01b4d_fUZ9e1Hw4YXHP76wvCeNmshM/f800/1773579801.webp?s=1e997954c696ba18c0e01c53b65cc21385002b66",
        "https://images1.vinted.net/t/05_00f5e_HKVa48xsb22rsJ3d2ktv7XET/f800/1773579801.webp?s=814268908927d76a0884a8f438c23fc12bc10b7c"
      ],
    vintedUrl: "https://www.vinted.de/items/8400248375"
  },
  {
    id: 3,
    name: "Adidas Originals Puffer Jacke Blau",
    category: "Jacken",
    price: "€22",
    size: "XL",
    condition: "Zufriedenstellend",
    images: [
        "https://images1.vinted.net/t/04_01bf0_D48FsSLrpGGLv7j1HQHuiNg9/f800/1772749815.webp?s=fa82c0bc1c848af67bddee3c53bf7c407a5d1325",
        "https://images1.vinted.net/t/04_01a9b_dHFvnUGCYwwKYauKHLtw4gsr/f800/1772749815.webp?s=4a4ace1726f728f433e5e7b291ba5273e5e26b0d",
        "https://images1.vinted.net/t/05_01581_Amxpzb4rNRRtnbEuVoM3apZF/f800/1772749815.webp?s=04b4785c70f3f437117adb1411abb172e5e33183",
        "https://images1.vinted.net/t/05_01c3d_pFWRS6PZP2UzVSXe1qG31pkz/f800/1772749815.webp?s=2f8f1b0d0238a6d15184b173d8937aade55fd20d",
        "https://images1.vinted.net/t/05_01dfc_FoBmb3iSt1kCcF8TjQW3jQ11/f800/1772749816.webp?s=cc4d33797fb8ad518cb4a8e62d879d94b07ccd29"
      ],
    vintedUrl: "https://www.vinted.de/items/8323545774"
  },
  {
    id: 4,
    name: "Adidas Originals Track Jacket Rot",
    category: "Jacken",
    price: "€26",
    size: "S",
    condition: "Sehr gut",
    images: [
        "https://images1.vinted.net/t/06_001da_kMqrpNgt9CkFx5rm1fFVLj1k/f800/1773951754.webp?s=91233be5e2bf86cf89e5473b18766b27d0a72dd0",
        "https://images1.vinted.net/t/01_015b2_HjczaUThjRd296rQdLN7TLDj/f800/1773951754.webp?s=eab21cdc9aabfdebbedde968d4fa159cc5e957ad",
        "https://images1.vinted.net/t/06_00838_mAURVQz2U2CZkyGQJ4pjWhQS/f800/1773951754.webp?s=e3d5d011a0a5529f4da045535289243568da3723",
        "https://images1.vinted.net/t/06_02014_X6VtZdGLLNN2ZUzuw3yNGXtR/f800/1773951754.webp?s=6aba65e35d26f98f5b3bbb3ff924d7345af2a6bd",
        "https://images1.vinted.net/t/01_000a4_TNTqCtfEDuQNPB3GJxZiLLx7/f800/1773951754.webp?s=dc491ac1ec48b44da9dacb13b2d2e06659e77eae"
      ],
    vintedUrl: "https://www.vinted.de/items/8436257572"
  },
  {
    id: 5,
    name: "Adidas Fleece Jacke Schwarz",
    category: "Jacken",
    price: "€14",
    size: "XL",
    condition: "Zufriedenstellend",
    images: [
        "https://images1.vinted.net/t/05_001b5_rAqzJHjisGiWzahLBgUXmDP3/f800/1773747209.webp?s=585faadb3805d1e5e7cefe12c0b935c9a8190b05",
        "https://images1.vinted.net/t/06_01cdc_43h6mJqQKHLsoU8Baz47EnJa/f800/1773747209.webp?s=cb3c20f42dc61f9d6cb295456845979885be792c",
        "https://images1.vinted.net/t/06_01342_aAPgUosMSp3mu3tULCVzRpPf/f800/1773747209.webp?s=5576173094cf22a1e7556e5ad7c2c7ab1e4bbd73",
        "https://images1.vinted.net/t/05_007c1_f2bVK5j7eGZP6TsxshwVg3bo/f800/1773747209.webp?s=b6f87fc756b07e5d2ff5b70717d93efad27b79ca",
        "https://images1.vinted.net/t/05_009e7_5aBGKkKzguHBPikqqxJD7MDV/f800/1773747209.webp?s=14c471117ba92cf1b06f6c1b22863449df7f572d"
      ],
    vintedUrl: "https://www.vinted.de/items/8416878208"
  },
  {
    id: 6,
    name: "Reebok NY Rangers Fleecejacke",
    category: "Jacken",
    price: "€29.90",
    size: "M",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/05_01ab1_3koKJ37q95NxbDyxh9jckewk/f800/1772721377.webp?s=8dd7f1c7f90b5840f06bcbbcaae85e0d3505b766",
        "https://images1.vinted.net/t/04_023ff_8oYRGQ57fKEXqv7SP9kKPPPk/f800/1772721377.webp?s=f6d948f79ca2f07d74546a99b947e021f46abe46",
        "https://images1.vinted.net/t/05_0050e_aSXMkWHe1BqBw4w7Qjtg2i6W/f800/1772721377.webp?s=7ce62acf553af9fda22c9f408c21db64b063374c",
        "https://images1.vinted.net/t/06_007bd_k3Bvp4zA23hyFXPYQfH7iob2/f800/1772721377.webp?s=f3f74e984c8f5b95d73365a1c23f0d53937f371c",
        "https://images1.vinted.net/t/06_0154b_x5VCC7AJrhKFNCar9r9EYz2j/f800/1772721377.webp?s=fd98874a2e22f884cc9e14cd0c36352fcf7e19b1"
      ],
    vintedUrl: "https://www.vinted.de/items/8320129694"
  },
  {
    id: 7,
    name: "La Martina Steppweste Schwarz Rot",
    category: "Jacken",
    price: "€25",
    size: "S/M",
    condition: "Sehr gut",
    images: [
        "https://images1.vinted.net/t/01_00220_4XS4MDyF8v3mLJ467BjVa5v5/f800/1773668985.webp?s=975f93870ea40b24b2cf7efa6eee5952cd91c296",
        "https://images1.vinted.net/t/06_01dd6_qxz3njgnkP8yZdVore2Z62wL/f800/1773668985.webp?s=0faedc3bdf3a5f25eb88dbda7f19fef1883e57d1",
        "https://images1.vinted.net/t/04_00d8c_56tNiYneM2tzpfEa6JDofoXs/f800/1773668985.webp?s=4db0b2d35c30520617928628577df67d4e563148",
        "https://images1.vinted.net/t/06_019f2_v6CuAoDvSjRph25TVtHg9wGt/f800/1773668985.webp?s=2f9e57715f8d8c6998fad60e45f636a2f1a80a7a",
        "https://images1.vinted.net/t/06_02332_CMbjz7y6rQ5QmT1YedvE6DFJ/f800/1773668985.webp?s=785e03f6a5c55c73e6da9434f17ce09339b6bd28"
      ],
    vintedUrl: "https://www.vinted.de/items/8410133047"
  },
  {
    id: 8,
    name: "Tommy Hilfiger Teddy Fleece Hoodie",
    category: "Pullover",
    price: "€25",
    size: "L",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/06_0163c_ZyVmFPAa4ouSgGTGkGUMWQjZ/f800/1774106471.webp?s=65e4615b32b4005a581015564d8ea60b5cb2d2fd",
        "https://images1.vinted.net/t/06_01874_3Fg5dv2DCtskcuFWPV7NCkPN/f800/1774106471.webp?s=c8a225d8d2de0ca0d0014fc8e87d13ae930de867",
        "https://images1.vinted.net/t/06_0000e_k6xKeEdFGVRFAUsGXR9jZyM8/f800/1774106471.webp?s=6355746e83cd2adf8b2e9e6403ef310397887b91",
        "https://images1.vinted.net/t/05_00e61_8gyK1BZQfRgNMheqwUi6pUNk/f800/1774106471.webp?s=49bdf997375551292915e7a815ebcb9c39e77cc5"
      ],
    vintedUrl: "https://www.vinted.de/items/8448746258"
  },
  {
    id: 9,
    name: "Tommy Hilfiger Teddy Fleece Quarter Zip",
    category: "Pullover",
    price: "€22",
    size: "L",
    condition: "Zufriedenstellend",
    images: [
        "https://images1.vinted.net/t/04_00377_R6n53bTCW16s9DGUaBQdeASQ/f800/1773749145.webp?s=cb2fb45d8d7fe0ab5d41f04ab4826a88a7bcb90c",
        "https://images1.vinted.net/t/06_016be_cLtsWCHHoeStRXxDxw48pZKp/f800/1773749145.webp?s=2a9a8b6e0b276166c1e4a8768d333eb107b3238f",
        "https://images1.vinted.net/t/05_01414_7HgdV74eRfsRueeHQw4Qg9Za/f800/1773749145.webp?s=4bcf32bc25dd2334507dca8c509de61fce0a448d",
        "https://images1.vinted.net/t/06_023cd_B9w5y4WX7s1E2GPbcezq6k9e/f800/1773749145.webp?s=d585172c1b65e3077d511a5c2c8677b55957bfc4",
        "https://images1.vinted.net/t/06_0261b_qeTWeo7djkNVZCAC3ZbEiqwC/f800/1773749145.webp?s=6b7820400fa5694e850ce4c1b6d6f7ede10f6495"
      ],
    vintedUrl: "https://www.vinted.de/items/8417156956"
  },
  {
    id: 10,
    name: "Helly Hansen Fleece Half Zip",
    category: "Pullover",
    price: "€25",
    size: "M",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/06_01462_7TEANiPZRgaFsLppzoghynVv/f800/1773706461.webp?s=2a329a1d9cc382e35c8450cd672820614e86182b",
        "https://images1.vinted.net/t/06_00456_MiatfL3DmaVAyNamhAKVvAPK/f800/1773706461.webp?s=aba20b7afaa78e1e97127b557513789a8749ce8b",
        "https://images1.vinted.net/t/05_01391_1MStogLJmmGFsQfn15vW77UR/f800/1773706461.webp?s=2657585b3a160689c1ecb4d8b7c803f2dc6d3760",
        "https://images1.vinted.net/t/06_00225_f8bb4pECwm6w3spmUQBmGuzA/f800/1773706461.webp?s=a889212a8716e7c810f204eddbc2f2fc2467748f",
        "https://images1.vinted.net/t/01_017cd_BhGUkrcaWREpiJw95djBe8mL/f800/1773706461.webp?s=0aa3c406e30d429cc0e6c0b9831fa45cb5e0692e"
      ],
    vintedUrl: "https://www.vinted.de/items/8414805903"
  },
  {
    id: 11,
    name: "Timberland Fleece Quarter Zip",
    category: "Pullover",
    price: "€26",
    size: "XL",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/06_00040_oyQtkRb6wgNfA18ZkhQKXy2z/f800/1774017964.webp?s=b34f3fb33aed2f2cac2df123b39d41514759cb41",
        "https://images1.vinted.net/t/05_012c3_j4Td7ZNuNmN6vrwmwkazTZpd/f800/1774017964.webp?s=a1184460206972ce7c138b0bc1f21218e65401e3",
        "https://images1.vinted.net/t/05_024a0_wX9mCAtQowJ8Pf2N4G6CNAJc/f800/1774017964.webp?s=888aa2509039311d19ce31b155b1bff2dcd3e2cb",
        "https://images1.vinted.net/t/06_024f4_mRw5yDqYp3nVQnBu3zaMbYFo/f800/1774017964.webp?s=fc5d98141121dc0251779e9f65e1da6d3fa32904",
        "https://images1.vinted.net/t/01_011ff_3k3PeTxamdLCzyTG9rLkJ5Tv/f800/1774017964.webp?s=75106a1cd63d0e97a176ac151d611524a138ff45"
      ],
    vintedUrl: "https://www.vinted.de/items/8440569340"
  },
  {
    id: 12,
    name: "Nike Cropped Fleece Crewneck",
    category: "Pullover",
    price: "€19.90",
    size: "S",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/06_017e4_pCyDvQ8B8fsxkJLc8kkcih5c/f800/1774018713.webp?s=344d1d99621ba1a059d4c6c23b40a9a91126a78d",
        "https://images1.vinted.net/t/01_01c0c_JjFmbKkiCydiBJxYmZWpt6Zx/f800/1774018713.webp?s=4e69c0e2b918a872ac31a5c722bf0d8d859a174f",
        "https://images1.vinted.net/t/05_01990_Kje3WKhM9uk5PBt7SrGEFn3x/f800/1774018713.webp?s=5da75bfdef648d125094955c869861185afc8e48",
        "https://images1.vinted.net/t/01_0243c_JgyY7Wndz9bgcUDuinH7Xq5E/f800/1774018713.webp?s=4faaf5fed4bbee0f2ef29e9e16f5a41a9be1963a",
        "https://images1.vinted.net/t/05_01664_8aMT2y5qU3VBdRPRXpPDd4JK/f800/1774018713.webp?s=68787cb6b8a312d18dfa7ba2c04b7cddb4e84659"
      ],
    vintedUrl: "https://www.vinted.de/items/8440675699"
  },
  {
    id: 13,
    name: "Lee Sport Wisconsin Badgers Sweatshirt",
    category: "Sweatshirts",
    price: "€34",
    size: "L",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/06_0084e_Yw7gdPLWQ8m5HQtQzBXhs9xm/f800/1773695157.webp?s=877c1c694927693e82f8b9d6986de17cce967ae9",
        "https://images1.vinted.net/t/05_021cc_b3QwJi1rjgSs9fd8WcutGXtf/f800/1773695157.webp?s=ce89c916021a39a75ac16e4efe14754d53290c2b",
        "https://images1.vinted.net/t/06_014da_u6zDaVusKowuxd5u2Scf5YiK/f800/1773695157.webp?s=b8f5370c3effea9af5cc4762aad54a2c5ad1d57d",
        "https://images1.vinted.net/t/01_024b9_JtLcZnqRqLVqxYtQRjjtHp5F/f800/1773695157.webp?s=2f1e6b390db7c878862ef2522f8eafed18b71526",
        "https://images1.vinted.net/t/06_015cc_SS61Re2p1CqnRTcfEhtJ8ugS/f800/1773695157.webp?s=150aef354e186bd931fdeca34373efe5dd41d4de"
      ],
    vintedUrl: "https://www.vinted.de/items/8414236896"
  },
  {
    id: 14,
    name: "Lee Sport Wisconsin Badgers Crewneck",
    category: "Sweatshirts",
    price: "€36",
    size: "L",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/06_0022a_fHhH2m857kZutLrvY1c8jjed/f800/1773705197.webp?s=1451f3a3c438f0383e10019ec873e8763784b9a0",
        "https://images1.vinted.net/t/05_0202a_uJecJpPNinjfSc7bWih7CLpM/f800/1773705197.webp?s=782f3b5f5f7c3bbcf50f1b1dddad93c4b8d14dfd",
        "https://images1.vinted.net/t/06_010ce_Au5aBgAkCetkb4GS2DiTyBJE/f800/1773705197.webp?s=d228608436c72dd4767993a3a02993c5dc83af75",
        "https://images1.vinted.net/t/06_020c7_rL38vKDErXKDPZJ8g4WqDPuv/f800/1773705197.webp?s=9223084de13b6f0dcccabbf0d8f1421899be5fdf",
        "https://images1.vinted.net/t/05_00bf5_WrofRkYC4pmWhjwgaKpeHE7C/f800/1773705197.webp?s=2fc1511bc7ce27b3af470f43f7b35556ffc803a4"
      ],
    vintedUrl: "https://www.vinted.de/items/8414786154"
  },
  {
    id: 15,
    name: "Vintage England Strickjacke Union Jack",
    category: "Sweatshirts",
    price: "€32",
    size: "M",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/05_00a99_3fq7YmVQH7r92JMuAXifxHvC/f800/1774031494.webp?s=3d255c9b1c3ede9d927d363c7a1e9f59d66b6f3a",
        "https://images1.vinted.net/t/05_0244c_GscCwDGudiubg7tFK2zacshF/f800/1774021138.webp?s=db84d82e960d4c82e9ee8eb4c08fefe567b5dcbc",
        "https://images1.vinted.net/t/05_00030_98kJYG6US4SVDb6vqwYPXtzN/f800/1774021138.webp?s=6e5b9695945e449d809bf6bebe254d83d243ee56",
        "https://images1.vinted.net/t/01_00f15_zircJaQdRDxKTw5qZsQsdcgf/f800/1774021138.webp?s=c7337aeac6e4a577fd7a2019b4f0cac4b6a3b026",
        "https://images1.vinted.net/t/05_01642_sXuvGkX95Np9Nkx7iCkH79EB/f800/1774021138.webp?s=929fa8aaab0dc81acebcb42786c9b6316ac9daca"
      ],
    vintedUrl: "https://www.vinted.de/items/8441012104"
  },
  {
    id: 16,
    name: "Adidas Track Jacket Grau Orange Trefoil Vintage",
    category: "Jacken",
    price: "€19",
    size: "S",
    condition: "Sehr gut",
    images: [
        "https://images1.vinted.net/t/04_00abf_7YbNaZTcMox6pitYXHb1JfVM/f800/1774105278.webp?s=971b72dc6cd41e95a71679d02fcd67253792c4d4",
        "https://images1.vinted.net/t/06_02144_YiH7EeaTBq5r7ZDY4RmyUnXW/f800/1774105278.webp?s=e8ea0d1ae95f314d8b1db515803dbad5e36c3d66",
        "https://images1.vinted.net/t/06_01870_HArTDGzm1SAewoDo5ioUUTf7/f800/1774105278.webp?s=e997d3b74de6e0f6e63e3d2d6f4b28dfa572636c",
        "https://images1.vinted.net/t/06_0120e_obAsctfmKdo77kHNsb9jPpEK/f800/1774105278.webp?s=77c8cc8355dc8cfcdcd623e3956d12332c823eb6",
        "https://images1.vinted.net/t/05_01125_RMbZK2FxhpHoEzivPs4DmGNd/f800/1774105278.webp?s=faa37e12208c7d857a427348a85f111a61d95012"
      ],
    vintedUrl: "https://www.vinted.de/items/8448527189"
  },
  {
    id: 17,
    name: "Tommy Hilfiger Athletics Fleece Sweatshirt Weiß Crewneck",
    category: "Sweatshirts",
    price: "€28",
    size: "L",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/06_004a4_SGRAKNYTRpMj34v7oF43YDtC/f800/1773748888.webp?s=ac945041e3ffdcf2d32dc6efd0611610e6d3b0dd",
        "https://images1.vinted.net/t/06_01858_T5J8SRDJTm7XiiYh2qEoKjbw/f800/1773748888.webp?s=36dc26f579295e505f6851da1345ab78bb655164",
        "https://images1.vinted.net/t/04_01a02_hWQFg7HReQHqmY7UToZBFtB5/f800/1773748888.webp?s=687f0818e17d2e26ae7ea0b851828c2d58d30bc1",
        "https://images1.vinted.net/t/06_01a62_uFJ9pwcrW76uGB7pH5PJiS5Q/f800/1773748888.webp?s=48e089ca21918f7f9dc51dc68368256ff8a90cc7",
        "https://images1.vinted.net/t/01_00cb6_HBAgMNN4JSTE2jkyukJrByis/f800/1773748888.webp?s=f5f28f0a59355860eec1bf7438ae1e1ecbd25102"
      ],
    vintedUrl: "https://www.vinted.de/items/8417120287"
  },
  {
    id: 18,
    name: "Lacoste Polo Shirt Rosé",
    category: "Tops",
    price: "€18",
    size: "S",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/05_01390_Pg1hP2GnqgYcH5RRiDoRKiGF/f800/1774019111.webp?s=d37ff629d5afc1027d249258ed4ea4ae0283bca7",
        "https://images1.vinted.net/t/05_01ea3_EXMyMdRP3gAv4wtBrQWUEpbi/f800/1774019111.webp?s=3643a31127f0d5d522a61778141c2a5ddf3298ba",
        "https://images1.vinted.net/t/05_009f2_eSAdjJAVVVCi9WtrvK9tj5dp/f800/1774019111.webp?s=56089e40a004815a4ed4f5a7379ca0bddd093376",
        "https://images1.vinted.net/t/06_00cfa_rWYhjtTVHyQZ2Pf4j18uANYs/f800/1774019111.webp?s=933327eb2ba93669c3fbed66a004ba6e235f4b4f",
        "https://images1.vinted.net/t/04_02187_sZUjGyk8hQAbKa5bKC39aTrh/f800/1774019111.webp?s=39c85650e5ad5ae779ea18259166742211de7437"
      ],
    vintedUrl: "https://www.vinted.de/items/8440731520"
  },
  {
    id: 19,
    name: "Tommy Hilfiger Polo Shirt Grün Navy Streifen",
    category: "Tops",
    price: "€23",
    size: "XL",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/06_015ba_p2SHGGF5tRtxVmEBchizMM4K/f800/1774031657.webp?s=fc6b00a093c96077a401ee98bb88cf3e3fdae813",
        "https://images1.vinted.net/t/03_00a32_zEiNey9c5NaR57RjbV2GAqyU/f800/1774021067.webp?s=c3c5e4045d4c8904888537bb2f1378327e9deaa3",
        "https://images1.vinted.net/t/05_00b11_yHs9LRJ4dneowpxgi1mdXTT9/f800/1774021067.webp?s=32e5800fd46c2366cf3dcd0914136bcbaa0570e7",
        "https://images1.vinted.net/t/06_012b5_rzxyvEjGbCuZupXDL2FubQTc/f800/1774021067.webp?s=893971806f737633fe4d1b7968f9207c0f914b22",
        "https://images1.vinted.net/t/06_00fd9_6GJ363visqnBmSVia48sx9CM/f800/1774021154.webp?s=f62f8a6cb20b51fa61d3d9bcd8d4e37f92618981"
      ],
    vintedUrl: "https://www.vinted.de/items/8441002241"
  },
  {
    id: 20,
    name: "Nike Park Trackjacket Windbreaker Weiß Blau",
    category: "Jacken",
    price: "€45",
    size: "S",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/01_0149d_Pi635amLLKJ8G9J8vFgXwmUD/f800/1774110116.webp?s=dbe91471c2dfdb2d26b7762da5049ed31326caad",
        "https://images1.vinted.net/t/03_022cc_fYLuoekNT9zbZqsGzDhkMF8N/f800/1774110116.webp?s=caa968e1be7b202f9ba9003c55f359ddd418f818",
        "https://images1.vinted.net/t/04_015fa_CgDDm3SssAPWD9AWrnMmoW3t/f800/1774110116.webp?s=7ddccadeb9dbf2ab4651222564e49906ada4c665",
        "https://images1.vinted.net/t/01_00ffa_4vwLEKE13uyjutyUMxtrUx5w/f800/1774110116.webp?s=813bd040870e47587d7e2fb10811c7f092864af8",
        "https://images1.vinted.net/t/01_0146f_KFQhVseZtgsU1PYga4j9mybt/f800/1774110116.webp?s=f5b4443e6155eac57f743e89afd1b33c7284cfdb"
      ],
    vintedUrl: "https://www.vinted.de/items/8449417132"
  },
  {
    id: 21,
    name: "Helly Hansen Fleece Quarter Zip Grau Orange Outdoor",
    category: "Pullover",
    price: "€25",
    size: "XXL",
    condition: "Sehr gut",
    images: [
        "https://images1.vinted.net/t/05_00f80_irY9g4qnXgHPKNyhKZhBtGKV/f800/1773518023.webp?s=097a875ccde9384360722c3d9e3c5f2ee14fe893",
        "https://images1.vinted.net/t/05_00893_czfa17RBpKCjTYDfFSW2kaqx/f800/1773518023.webp?s=5c000ac21ae3025a4c1ce79bc96b6edb8255d890",
        "https://images1.vinted.net/t/05_00ac8_BWATmqxooEZUVKqmw2uB27B8/f800/1773518023.webp?s=82441b60f311335358afdb1c299d51947fe1231a",
        "https://images1.vinted.net/t/06_0171c_rYjwgCCqYaSPoRcgdv5JVarz/f800/1773518023.webp?s=5703e63fca4200891dfa28f9507892a069a2a715",
        "https://images1.vinted.net/t/05_004e0_r5snRgsbZyAeQSX2SNLYDsjm/f800/1773518023.webp?s=2e23cf4052d47f7546b20f09675e4cdd6baa1569"
      ],
    vintedUrl: "https://www.vinted.de/items/8395132293"
  },
  {
    id: 22,
    name: "Nike Vintage Sweatshirt Big Swoosh Grün Crewneck",
    category: "Sweatshirts",
    price: "€34",
    size: "XL",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/05_01641_LVv5eNLqRADoWxsgH1sh2MVi/f800/1773748132.webp?s=700d6c354687e1173f3442e7d2dbd7a2df52e5a7",
        "https://images1.vinted.net/t/06_016c2_gFwUfVqiFJGsHokzCvaxxfMY/f800/1773748132.webp?s=2dfbab9ebfee7de1feb157fdc69d50a2b220bf8f",
        "https://images1.vinted.net/t/05_00809_VzDndjpDpiC8UPTg4aBmx7jy/f800/1773748132.webp?s=4e2ea485394ef41c8d658dd2e5c4f5c60a8004b5",
        "https://images1.vinted.net/t/03_00a78_dpntXCBdYmavCxF6cAPaB64j/f800/1773748132.webp?s=26aef2591152733271845e5c9abe6cca19b49af9",
        "https://images1.vinted.net/t/05_017c5_CH1uzBQVhhPaU24K7UVGVnGU/f800/1773748132.webp?s=19ebb807446a54037d578fe182a67143b0303b0e"
      ],
    vintedUrl: "https://www.vinted.de/items/8417010800"
  },
  {
    id: 23,
    name: "Nike Vintage Fleece Jacket Grau Thumbholes Athletic Dept",
    category: "Jacken",
    price: "€22",
    size: "XS",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/05_015b6_j3dLkRBcqDkBNqvfCZWqC5Hf/f800/1773571927.webp?s=1c98260b24d469a21ae2ada9e313b498ad7f8536",
        "https://images1.vinted.net/t/05_01b3f_5kAhtUMurTNzN1uth658vwWy/f800/1773571927.webp?s=b7e7f75784abac881aaa2275cac6b2c27b897243",
        "https://images1.vinted.net/t/06_0062d_f2KDJeQ1a3nxcrCVhtv4Azsp/f800/1773570920.webp?s=85b84a3797f9eff85414f450c2ac00d1ea2f75da",
        "https://images1.vinted.net/t/06_00681_7mwyidsCoCQGXQxH83aPd7Z6/f800/1773570920.webp?s=41517d6a413911fe9d3f87e7dd0a899dcaa3078d",
        "https://images1.vinted.net/t/05_00bd3_9XLxkyBRDDLHyrks32hhZp1x/f800/1773570920.webp?s=9730a7d6bf949bfbb92aa57d0442d8d9d6389e7c"
      ],
    vintedUrl: "https://www.vinted.de/items/8398245553"
  },
  {
    id: 24,
    name: "Vintage Starter Green Bay Packers 96/97 Champs Crewneck",
    category: "Sweatshirts",
    price: "€33",
    size: "XL",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/04_0138e_Th8543Q3YYQnnRR1PfXZR3QT/f800/1774018164.webp?s=4eef4ca660ee11d184712b68f34c7d6ea4a3531d",
        "https://images1.vinted.net/t/06_01191_QCBX7W6LUKZCFdSjysyQiuik/f800/1774018164.webp?s=7058e6776025b00f0909bacf4500da9b7fdd25d6",
        "https://images1.vinted.net/t/05_00b3b_3yugjwu8G1FZWyGEq2uMESSG/f800/1774018164.webp?s=c28a774df0cada482d4b5501119994246577d04b",
        "https://images1.vinted.net/t/06_0095b_drN71XoCDS4f5TNFzuHRYTEB/f800/1774018164.webp?s=896844000ab67a4bd8d22ed890da68295bb7f807",
        "https://images1.vinted.net/t/05_0150d_Uv52BpFAxRimFFv3xaGUGCGk/f800/1774018164.webp?s=8af714ae5614bcd775f7c922654690fed9918e49"
      ],
    vintedUrl: "https://www.vinted.de/items/8440597862"
  },
  {
    id: 26,
    name: "Reebok New York Jets Fleece Jacke Grün NFL Vintage",
    category: "Jacken",
    price: "€25",
    size: "XXL",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/03_007ba_6Ex7LXe1ZpJN7RhzMMJ3sZ1N/f800/1773748600.webp?s=fbdfcca8432bd8897e2bb963f8b47fd15f85c268",
        "https://images1.vinted.net/t/05_0225a_RneAUxB4i6uzPE9WqAAQYM4o/f800/1773748600.webp?s=2ecae4c575b0ecdf1118567d9ce00b7eb55d71a9",
        "https://images1.vinted.net/t/06_004ef_fcYTEHjWPnKxfPYzkXmdbz57/f800/1773748600.webp?s=a5d8a0bacb58d485f67ca82506947b64d6c49690",
        "https://images1.vinted.net/t/04_00a6b_XN56QWcWLQx8UZXn7mackk1e/f800/1773748600.webp?s=39f802f7b1d6c1923890ccf9f0fb263e2222a917",
        "https://images1.vinted.net/t/04_00bfc_ozJpDSj6dbXWzS7FV5xowxoz/f800/1773748600.webp?s=12cd5d0665138261c5a471afb2932bbb6b850b63"
      ],
    vintedUrl: "https://www.vinted.de/items/8417078850"
  },
  {
    id: 27,
    name: "Nike Puffer Jacke Türkis XS",
    category: "Jacken",
    price: "€25",
    size: "XS",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/05_0135f_NGV5Rp1E8o2oVKDyfZrdsPvC/f800/1773062786.webp?s=96bcec68740e0106d8f33a95ca73a282e23d3dc0",
        "https://images1.vinted.net/t/06_02684_pwN7Cz5cxJjV5gs3sUgfMrgt/f800/1773062786.webp?s=3c8ef8e9029970c0781937b05c87884dccf4449b",
        "https://images1.vinted.net/t/01_00786_NhKZDcGaC7PaBw5NpL9Hykdo/f800/1773062786.webp?s=7e9033539177549bd64a09d85aac31596f5d1b4d",
        "https://images1.vinted.net/t/05_0015b_YmKYjHhL7EDxTTrKKKrzXLCQ/f800/1773062786.webp?s=fc601e5204db2aaf13bcc1039fee5f62d47ff27d",
        "https://images1.vinted.net/t/01_01719_wERPQpVbHcJwKdghH5EVtnm9/f800/1773062786.webp?s=a10aecf56d305df25a3fca165572e179e9e03366"
      ],
    vintedUrl: "https://www.vinted.de/items/8352298824"
  },
  {
    id: 28,
    name: "Nike Windbreaker Jacke Blau Swoosh Vintage",
    category: "Jacken",
    price: "€38",
    size: "L",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/06_01780_iUoK85Pss7d9DfczowRxQRN2/f800/1773706305.webp?s=dcf40dce54cb826d2959e92f24fa0a035a4f885d",
        "https://images1.vinted.net/t/04_02648_g6ceYNArtfNp5AFmiPksnc1W/f800/1773706305.webp?s=cb02701c6e5a8b25ad485b2abf567cdcd6701f2c",
        "https://images1.vinted.net/t/05_01536_MLofZGvq7Uciwdqc5d1wmpbo/f800/1773706305.webp?s=07eb04bf9986122c4c7dc3d0506b229815c425b1",
        "https://images1.vinted.net/t/04_01d46_J1GdCfVABL7TFXYzMicc9JA5/f800/1773706305.webp?s=df367e72872d22369d33d1cdbc0cf0dd19ac797d",
        "https://images1.vinted.net/t/06_0266d_DV2LFVoS9L41UnHew5wry5z6/f800/1773706305.webp?s=5b43587b7a6a0be9fa156887a0157b87257c26c2"
      ],
    vintedUrl: "https://www.vinted.de/items/8414803706"
  },
  {
    id: 29,
    name: "Lacoste Fleece Jacke Schwarz Vintage Crocodile",
    category: "Jacken",
    price: "€25",
    size: "L",
    condition: "Zufriedenstellend",
    images: [
        "https://images1.vinted.net/t/06_0031e_g9uWwjTMgjCnyhFmHYUtGdAY/f800/1772751651.webp?s=8a2e8ec6d39d605d6cdb16909eb2de94bab098f9",
        "https://images1.vinted.net/t/04_023dd_x97n4czE8wXJB4a6Bj5V5hQE/f800/1772751651.webp?s=3f8413664fea2951bec25b87dab9a276dfc00bae",
        "https://images1.vinted.net/t/05_02094_XJD8WNpNkBo4S2pcr5FynARM/f800/1772751651.webp?s=e4d688cad32c0737a60f5eff434c16ec5a0ffce4",
        "https://images1.vinted.net/t/06_0245a_yRg6BnEXJQVdvf1c7DKy7gUG/f800/1772751651.webp?s=3d69ae16ae319061acb2eeff85067a6f248fce3f",
        "https://images1.vinted.net/t/04_01a54_ZPXE8HZ3nKRifWtKxvH78YnU/f800/1772751651.webp?s=6890f33509c97377f343c94f8579134486172a11"
      ],
    vintedUrl: "https://www.vinted.de/items/8323619467"
  },
  {
    id: 30,
    name: "Helly Hansen Fleece 1/4 Zip Vintage Lila Violett",
    category: "Pullover",
    price: "€19",
    size: "M",
    condition: "Zufriedenstellend",
    images: [
        "https://images1.vinted.net/t/06_01cd1_6qbnSHZGDRYnHj5gaTWwLupR/f800/1773705616.webp?s=36df5cd624355f745cf87b4b846c1f70cac6f14a",
        "https://images1.vinted.net/t/06_005e7_4aRnmnufo31LQ4uuetU2wXi9/f800/1773705616.webp?s=832589504ae11f684c5b9cfb81ffa90ec0e27f2a",
        "https://images1.vinted.net/t/05_01f5c_pvFETyt6awYi3GgaqLpnUZrL/f800/1773705616.webp?s=9267356a5ec28fbcb91f44f2d6b784c4704f04f9",
        "https://images1.vinted.net/t/05_016d3_Yb7uFQia3nHiv8eUaAc8GRvC/f800/1773705616.webp?s=e4beda81dead998c874b58ee6af42ced838d778f",
        "https://images1.vinted.net/t/05_00190_9CG97giAy7swkrFMsrMexwoh/f800/1773705616.webp?s=59798c3600ab68c00bd89b82b9fcbbb4669f1e2c"
      ],
    vintedUrl: "https://www.vinted.de/items/8414793323"
  },
  {
    id: 31,
    name: "Adidas Fleece Pullover Half Zip Grau Rot Vintage",
    category: "Pullover",
    price: "€20",
    size: "XL",
    condition: "Zufriedenstellend",
    images: [
        "https://images1.vinted.net/t/01_02099_LjqYaitr28tJxU1XXV2pWTxw/f800/1772822269.webp?s=bfedb24ac87414a8ac6cbdf48003c1017d3d5d5f",
        "https://images1.vinted.net/t/06_000b0_pxvEka87tKpoEX3jf4Rude1x/f800/1772822981.webp?s=bc21087326eb8b8de95ca907c8782e2a655729bf",
        "https://images1.vinted.net/t/01_0130a_VduiTybKrxiq1jDHMstenKzk/f800/1772822269.webp?s=a9361cf3a92b68b29b8d3a71eaaeba4c57311414",
        "https://images1.vinted.net/t/04_00f0f_XyYnHNfLfnqGB2EKNP6hm9zz/f800/1772822269.webp?s=ccc27bd8400afd75f220080bcb6c30db08f8605d",
        "https://images1.vinted.net/t/06_00e4f_YaMEgvFqi2qHVVJmFqakf8m1/f800/1772822269.webp?s=2fba98ebfa2cfd87088ca1063af3747aa0c4131e"
      ],
    vintedUrl: "https://www.vinted.de/items/8329226132"
  },
  {
    id: 32,
    name: "NHL Washington Capitals Fleece Sherpa Vintage",
    category: "Pullover",
    price: "€22",
    size: "M",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/06_01994_ZTAGXe1deKUSF8mxBsVj4Gfs/f800/1773499294.webp?s=526701d028e6f005a66174a4c9de1092d25a958e",
        "https://images1.vinted.net/t/06_00922_1KMnHZzEzj4CQsLrh8ZbPnFc/f800/1773499294.webp?s=f1c4a91a65b0066016f1a88cbc2595e60b7cf04e",
        "https://images1.vinted.net/t/05_00988_5L4mHi7LjyfS71BQmwScYgU5/f800/1773499294.webp?s=a5527311604bef7a064030076611dfd0263984ba",
        "https://images1.vinted.net/t/06_01029_6P1ERkqtxYXMSociDwkNd6jF/f800/1773499294.webp?s=ac61cc3760710b04392fd1c4faa41c901dae2125",
        "https://images1.vinted.net/t/05_01f0f_qmbTaB87JBF4RawnnsMzrMyY/f800/1773499294.webp?s=83a6646f2a2a9546cc18f55beb45ff54b78a6c41"
      ],
    vintedUrl: "https://www.vinted.de/items/8391936347"
  },
  {
    id: 33,
    name: "Nike Vintage Fleece Pullover Rot Swoosh Crewneck",
    category: "Pullover",
    price: "€29",
    size: "L",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/05_0128e_Muquhvc4yd3ECMa3jbTzqC8V/f800/1773704829.webp?s=5c2d68463c57c351099b41e5d9bb6dc19eaa70b8",
        "https://images1.vinted.net/t/05_01c2c_2Rz2xi9F11jNhW9fwMTy1imR/f800/1773704829.webp?s=88a46f35e21eca9a34fbdf8c9f759cccadbc7b05",
        "https://images1.vinted.net/t/05_00874_PgvQ5k2wTiEMirdkNtwAMEYd/f800/1773704829.webp?s=48154852696a15f25d9e217a82451c759f09b279",
        "https://images1.vinted.net/t/06_0207e_KChNZUCfU4mr6uw1fh9Pod9K/f800/1773704829.webp?s=6c6dae9d1e4fa1980f6106d22c9e601bf18b6905",
        "https://images1.vinted.net/t/05_00577_6zStDfkhjvZNeYe4bc5eJHjh/f800/1773704829.webp?s=9f0fe307681a9e0684c420b6644514df3ee185f4"
      ],
    vintedUrl: "https://www.vinted.de/items/8414779381"
  },
  {
    id: 34,
    name: "Chaps Ralph Lauren Sweatshirt Vintage Faded Grau",
    category: "Sweatshirts",
    price: "€26",
    size: "L",
    condition: "Gut",
    images: [
        "https://images1.vinted.net/t/05_01bfc_zekkHsmBD43m1SQymkHsGJNY/f800/1774105800.webp?s=b766563db47939331f168ea3b917b73acd3826fe",
        "https://images1.vinted.net/t/06_004a0_UXyBDuufHJMvQR2nyQYQStYF/f800/1774105800.webp?s=51206b508ce017079ca7d17a97a2e339883b546d",
        "https://images1.vinted.net/t/01_01ae9_FKnSacS5M4h7EvdSW6bD6hem/f800/1774105800.webp?s=3b1c995fbac6332931a1795e4e7f224d631bf8fa",
        "https://images1.vinted.net/t/05_02240_36QPdaaLL6mPD19r6kYYQvKd/f800/1774105800.webp?s=1b988f53fae382bd2c1c5d7d1d5737c4c4e00841",
        "https://images1.vinted.net/t/04_005f7_gGmc7ocnqtNJcjaf7vSbACWE/f800/1774105800.webp?s=14b0445dc3d6f68bf1f793f532ab44f66cbf61d9"
      ],
    vintedUrl: "https://www.vinted.de/items/8448623083"
  },
  {
    id: 35,
    name: "Helly Hansen Fleece Pullover Vintage Y2K Half Zip",
    category: "Pullover",
    price: "€16",
    size: "XL",
    condition: "Zufriedenstellend",
    images: [
        "https://images1.vinted.net/t/05_01efb_eiqNWQqeTyLPHPNBiLXHDZms/f800/1772753053.webp?s=5aa5b9dfa0de9fc6d8626ab262f74630b64df657",
        "https://images1.vinted.net/t/05_00d57_C2j9ic8Quj4ATLHfZr9mk2yZ/f800/1772753053.webp?s=52c78493bfa536cfe4c2563c2fd874562dda9e53",
        "https://images1.vinted.net/t/04_021ac_KhQvgo4ZSDk9dzwmvNintn4u/f800/1772753053.webp?s=daa3d340b92b7dfe4a8b83a0bde64442ed58a66f",
        "https://images1.vinted.net/t/06_02154_b8fUz57Wx4cBNERBneEPHW7G/f800/1772753053.webp?s=3eb15a16a53c4746fb8ac977f29983a1f10e58da",
        "https://images1.vinted.net/t/06_00838_diKMEEx8VpTTZDAxAEYUeF7U/f800/1772753053.webp?s=16932167a5cc6c0dbfb404b8d5db1139d66862ca"
      ],
    vintedUrl: "https://www.vinted.de/items/8323660018"
  },
];

const allCategories = ["Alle", ...Array.from(new Set(products.map(p => p.category)))];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Alle");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = activeCategory === "Alle"
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans selection:bg-[#FF4400] selection:text-white">
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold tracking-tighter">
            <span className="text-[#FF4400]">SCND</span>_UNIT
          </motion.div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#products" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">Inventory</a>
            <a href="#about" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">About</a>
            <a href="#contact" className="text-sm uppercase tracking-widest hover:text-[#FF4400] transition-colors">Contact</a>
            <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="px-6 py-2 bg-[#FF4400] text-white text-sm uppercase tracking-widest hover:bg-[#FF4400]/80 transition-colors">Shop Vinted</a>
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-[#0A0A0A] border-t border-[#1A1A1A]">
              <div className="flex flex-col p-6 gap-4">
                <a href="#products" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest">Inventory</a>
                <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest">About</a>
                <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-lg uppercase tracking-widest">Contact</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,26,26,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(26,26,26,0.5)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.p variants={fadeIn} className="text-[#FF4400] text-sm uppercase tracking-[0.3em] mb-4">Bad Kreuznach, DE</motion.p>
            <motion.h1 variants={fadeIn} className="text-6xl md:text-9xl font-bold tracking-tighter mb-6">
              <span className="block">SCND</span>
              <span className="block text-[#1A1A1A] [-webkit-text-stroke:2px_#F5F5F5]">UNIT</span>
            </motion.h1>
            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4 text-sm uppercase tracking-widest text-gray-400 mb-8">
              <span>Streetwear</span><span className="text-[#FF4400]">•</span><span>Vintage</span><span className="text-[#FF4400]">•</span><span>Y2K</span><span className="text-[#FF4400]">•</span><span>Gorpcore</span>
            </motion.div>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="group inline-flex items-center gap-2 px-8 py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-all">
                Browse Inventory <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#products" className="inline-flex items-center gap-2 px-8 py-4 border border-[#1A1A1A] hover:border-[#FF4400] hover:text-[#FF4400] transition-all uppercase tracking-widest">View Selection</a>
            </motion.div>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-[#1A1A1A] rounded-full flex justify-center">
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1 h-2 bg-[#FF4400] rounded-full mt-2" />
          </div>
        </motion.div>
      </section>

      <section className="border-y border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400"><Clock className="w-5 h-5 text-[#FF4400]" />Versand innerhalb 48h</div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400"><Shield className="w-5 h-5 text-[#FF4400]" />Ehrliche Beschreibungen</div>
            <div className="flex items-center justify-center gap-3 text-sm uppercase tracking-widest text-gray-400"><MessageCircle className="w-5 h-5 text-[#FF4400]" />Schneller Support</div>
          </div>
        </div>
      </section>

      <section id="products" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">CURRENT_<span className="text-[#FF4400]">INVENTORY</span></h2>
            <p className="text-gray-400 uppercase tracking-widest text-sm">Alle Artikel auf Vinted verfügbar • Regelmäßig neue Drops</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-12 flex-wrap">
            <Filter className="w-4 h-4 text-[#FF4400]" />
            {allCategories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${activeCategory === cat ? 'border-[#FF4400] text-[#FF4400] bg-[#FF4400]/10' : 'border-[#1A1A1A] text-gray-400 hover:border-[#FF4400] hover:text-[#FF4400]'}`}>
                {cat}
              </button>
            ))}
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.div key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.a key={product.id} href={product.vintedUrl} target="_blank" rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
                  className="group relative bg-[#1A1A1A] overflow-hidden hover:ring-2 hover:ring-[#FF4400] transition-all">
                  <ImageSlider images={product.images} alt={product.name} condition={product.condition} />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{product.category}</p>
                        <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-[#FF4400] transition-colors leading-tight">{product.name}</h3>
                      </div>
                      <span className="text-xl font-bold text-[#FF4400] shrink-0">{product.price}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#0A0A0A]">
                      <span className="text-sm text-gray-400 uppercase tracking-widest">{product.size !== "–" ? `Size ${product.size}` : ""}</span>
                      <span className="inline-flex items-center gap-1 text-sm uppercase tracking-widest text-[#FF4400] group-hover:gap-2 transition-all">View <ExternalLink className="w-4 h-4" /></span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </AnimatePresence>
          <div className="mt-16 text-center">
            <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="inline-flex items-center gap-2 px-8 py-4 border border-[#FF4400] text-[#FF4400] hover:bg-[#FF4400] hover:text-white transition-all uppercase tracking-widest">
              Alle Artikel auf Vinted <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="py-24 bg-[#1A1A1A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,68,0,0.03)_50%,transparent_51%)] bg-[length:20px_20px]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">ABOUT_<span className="text-[#FF4400]">UNIT</span></h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>SCND UNIT ist ein Curated Reselling-Projekt aus Bad Kreuznach. Wir suchen die besten Vintage-Pieces, Streetwear-Klassiker und Y2K-Schnäppchen – und bringen sie zu dir.</p>
                <p>Unser Fokus liegt auf ehrlichen Beschreibungen, schnellem Versand (innerhalb 48h) und einem sorgfältig ausgewählten Inventar. Von Gorpcore-Utility bis zu Vintage-Grails: Jedes Piece wird von uns geprüft und fotografiert.</p>
                <p className="text-[#FF4400] font-bold uppercase tracking-widest text-sm">Kein Fast Fashion – nur Qualität mit Geschichte.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="aspect-square bg-[#0A0A0A] border border-[#FF4400]/20 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl font-bold text-[#FF4400]/20 mb-4">SCND</div>
                  <div className="grid grid-cols-2 gap-4 text-sm uppercase tracking-widest">
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]"><span className="block text-2xl font-bold text-[#FF4400]">100%</span><span className="text-gray-500">Authentic</span></div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]"><span className="block text-2xl font-bold text-[#FF4400]">48h</span><span className="text-gray-500">Shipping</span></div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]"><span className="block text-2xl font-bold text-[#FF4400]">DE</span><span className="text-gray-500">Based</span></div>
                    <div className="p-4 bg-[#1A1A1A] border border-[#0A0A0A]"><span className="block text-2xl font-bold text-[#FF4400]">32+</span><span className="text-gray-500">Items</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">GET_IN_<span className="text-[#FF4400]">TOUCH</span></h2>
            <p className="text-gray-400 mb-12 uppercase tracking-widest">Fragen zu einem Artikel? Schreib uns auf Vinted oder Instagram.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest hover:bg-[#FF4400]/80 transition-all">
                <MessageCircle className="w-5 h-5" />Nachricht auf Vinted
              </a>
              <a href="https://www.instagram.com/scnd.unit" target="_blank" className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-[#1A1A1A] hover:border-[#FF4400] hover:text-[#FF4400] transition-all uppercase tracking-widest">
                <Instagram className="w-5 h-5" />@scnd.unit
              </a>
            </div>
            <div className="mt-16 flex items-center justify-center gap-2 text-sm text-gray-500 uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-[#FF4400]" />Bad Kreuznach, Deutschland
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-[#1A1A1A] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold tracking-tighter"><span className="text-[#FF4400]">SCND</span>_UNIT</div>
          <div className="flex gap-6 text-sm uppercase tracking-widest text-gray-500">
            <a href="https://www.vinted.de/member/3138250645-scndunit" target="_blank" className="hover:text-[#FF4400] transition-colors">Vinted</a>
            <a href="https://www.instagram.com/scnd.unit" target="_blank" className="hover:text-[#FF4400] transition-colors">Instagram</a>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-widest">© 2025 SCND UNIT • Bad Kreuznach</p>
        </div>
      </footer>
    </div>
  );
}
