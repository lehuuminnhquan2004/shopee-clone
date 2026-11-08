import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

const MAX_BIGINT = 9223372036854775807n;
const MAX_INT = 2147483647;
const MAX_ATTEMPTS = 3;

//Lỗi nghiệp vụ: du lieu hop le nhung khong thực hiện được thao tác
class CartError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}
export async function addCartItem(
  req: Request,
  res: Response
): Promise<void> {
  const user = req.authUser;

  if (!user) {
    res.status(401).json({
      message: "Chưa đăng nhập",
    })
    return
  }
  const rawModelId: unknown = req.body?.modelId;
  const quantity: unknown = req.body?.quantity;

  if (
    typeof rawModelId !== "string" ||
    !/^[1-9]\d{0,18}$/.test(rawModelId)
  ) {
    res.status(400).json({
      message: "ID biến thể không hợp lệ",
    });
    return;
  }
  const modelId = BigInt(rawModelId);

  if (modelId > MAX_BIGINT) {
    res.status(400).json({
      message: "ID biến thể vượt giới hạn cho phép",
    });
    return;
  }
  // quantity phải là số nguyên dương trong giới hạn INTEGER.
  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    quantity > MAX_INT
  ) {
    res.status(400).json({
      message: "Số lượng phải là số nguyên dương hợp lệ",
    });
    return;
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const cartItem = await prisma.$transaction(
        async (tx) => {
          const model = await tx.productModel.findFirst({
            where: {
              id: modelId,
              status: "active",
              product: {
                status: "active",
                deletedAt: null,
                shop: {
                  status: "active",
                },
              },
            },
            select: {
              id: true,
              inventory: {
                select: {
                  stock: true,
                  reservedStock: true,
                },
              },
            },
          })
          if (!model) {
            throw new CartError(
              404,
              "MODEL_UNAVAILABLE",
              "Biến thể không tồn tại hoặc hiện không được bán",
            );
          }
          const availableStock = model.inventory ? model.inventory.stock - model.inventory.reservedStock : 0;

          const existingItem = await tx.cartItem.findUnique({
            where: {
              userId_modelId: {
                userId: user.id,
                modelId
              }
            }, select: {
              quantity: true
            }
          })
          const nextQuantity = quantity + (existingItem?.quantity ?? 0)

          if (nextQuantity > MAX_INT) {
            throw new CartError(
              409,
              "QUANTITY_LIMIT_EXCEEDED",
              "Tổng số lượng sản phẩm trong giỏ vượt giới hạn cho phép",
            );
          }

          if (nextQuantity > availableStock) {
            throw new CartError(
              409,
              "INSUFFICIENT_STOCK",
              "Tổng số lượng trong giỏ vượt quá số lượng còn có thể mua",
            );
          }
          return tx.cartItem.upsert({
            where: {
              userId_modelId: {
                userId: user.id,
                modelId
              }
            },
            create: {
              userId: user.id,
              modelId,
              quantity,
            },
            update: {
              quantity: nextQuantity,
            },
            select: {
              id: true,
              modelId: true,
              quantity: true,
              selected: true,
            },
          })

        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      //Transaction hoan tat
      res.status(200).json({
        message: "Đã thêm sản phẩm vào giỏ hàng",
        item: {
          id: cartItem.id.toString(),
          modelId: cartItem.modelId.toString(),
          quantity: cartItem.quantity,
          selected: cartItem.selected,
        },
      });
      return;
    } catch (err) {
      const isConflict = err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "P2034" || err.code === "P2002");

      if (isConflict) {
        if (attempt < MAX_ATTEMPTS - 1) {
          continue
        }
        res.status(409).json({
          code: "CART_BUSY",
          message: "Giỏ hàng đang bận vui lòng thử lại"
        })
        return
      }
      if (err instanceof CartError) {
        res.status(err.status).json({
          code: err.code,
          message: err.message,
        })
        return
      }
      console.error("Add cart item error:", err);

      res.status(500).json({
        message: "Không thể thêm vào giỏ hàng. Vui lòng thử lại",
      });
      return;
    }
  }
}

export async function getCartItems(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.authUser;

  if (!user) {
    res.status(401).json({
      message: "Vui lòng đăng nhập",
    });
    return;
  }

  try {
    const cartItems = await prisma.cartItem.findMany({
      // Chỉ lấy giỏ hàng của người đã được xác thực.
      where: {
        userId: user.id,
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      select: {
        id: true,
        quantity: true,
        selected: true,
        model: {
          select: {
            id: true,
            name: true,
            price: true,
            status: true,
            inventory: {
              select: {
                stock: true,
                reservedStock: true,
              },
            },
            tierOptions: {
              // Option của tier đầu tiên đứng trước.
              orderBy: {
                tierOption: {
                  tier: {
                    position: "asc",
                  },
                },
              },
              select: {
                tierOption: {
                  select: {
                    imageUrl: true,
                  },
                },
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                status: true,
                deletedAt: true,
                images: {
                  orderBy: [
                    { position: "asc" },
                    { id: "asc" },
                  ],
                  take: 1,
                  select: {
                    url: true,
                  },
                },
                shop: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const items = cartItems.map((item) => {
      const model = item.model;
      const product = model.product;
      const shop = product.shop;

      const availableStock = model.inventory
        ? Math.max(
          0,
          model.inventory.stock - model.inventory.reservedStock,
        )
        : 0;

      let unavailableReason: string | null = null;

      if (shop.status !== "active") {
        unavailableReason = "Shop hiện không hoạt động";
      } else if (
        product.status !== "active" ||
        product.deletedAt !== null
      ) {
        unavailableReason = "Sản phẩm hiện không được bán";
      } else if (model.status !== "active") {
        unavailableReason = "Biến thể hiện không được bán";
      } else if (availableStock === 0) {
        unavailableReason = "Biến thể đã hết hàng";
      } else if (item.quantity > availableStock) {
        unavailableReason =
          `Chỉ còn ${availableStock} sản phẩm, vui lòng giảm số lượng`;
      }

      // Ưu tiên ảnh option của tier đầu tiên.
      // Nếu không có, dùng ảnh đầu tiên của sản phẩm.
      const imageUrl =
        model.tierOptions[0]?.tierOption.imageUrl ??
        product.images[0]?.url ??
        null;

      const lineTotal = model.price * BigInt(item.quantity);

      return {
        id: item.id.toString(),
        quantity: item.quantity,
        selected: item.selected,
        availableStock,
        canCheckout: unavailableReason === null,
        unavailableReason,
        lineTotal: lineTotal.toString(),
        model: {
          id: model.id.toString(),
          name: model.name,
          price: model.price.toString(),
        },
        product: {
          id: product.id.toString(),
          name: product.name,
          imageUrl,
        },
        shop: {
          id: shop.id.toString(),
          name: shop.name,
        },
      };
    });

    // Chỉ tính tiền những dòng đã chọn và đang đủ điều kiện mua.
    const selectedItems = items.filter(
      (item) => item.selected && item.canCheckout,
    );

    const selectedSubtotal = selectedItems.reduce(
      (total, item) => total + BigInt(item.lineTotal),
      0n,
    );

    const selectedQuantity = selectedItems.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    res.status(200).json({
      items,
      summary: {
        itemCount: items.length,
        selectedItemCount: selectedItems.length,
        selectedQuantity,
        selectedSubtotal: selectedSubtotal.toString(),
      },
    });
  } catch (error) {
    console.error("Get cart items error:", error);

    res.status(500).json({
      message: "Không thể lấy giỏ hàng. Vui lòng thử lại",
    });
  }
}

export async function updateCartItemSelected(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.authUser

  if (!user) {
    res.status(401).json({
      message: "vui lòng đăng nhập"
    })
    return
  }
  const rawItemId = req.params.itemId;
  const selected = req.body?.selected;

  if (
    typeof rawItemId !== "string" ||
    !/^[1-9]\d{0,18}$/.test(rawItemId)
  ) {
    res.status(400).json({
      message: "ID dòng giỏ hàng không hợp lệ",
    });
    return;
  }

  const itemId = BigInt(rawItemId);

  if (itemId > MAX_BIGINT) {
    res.status(400).json({
      message: "ID dòng giỏ hàng vượt giới hạn cho phép",
    });
    return;
  }

  // false là dữ liệu hợp lệ, không dùng if (!selected).
  if (typeof selected !== "boolean") {
    res.status(400).json({
      message: "selected phải là true hoặc false",
    });
    return;
  }

  try {
    const result = await prisma.cartItem.updateMany({
      where: {
        userId: user.id,
        id: itemId
      }, data: {
        selected,
      }
    });
    if (result.count === 0) {
      res.status(404).json({
        message: "Không tìm thấy sản phẩm trong giỏ"
      })
      return
    }
    res.status(200).json({
      message: selected
        ? "Đã chọn sản phẩm"
        : "Đã bỏ chọn sản phẩm",
      item: {
        id: itemId.toString(),
        selected,
      },
    });
  } catch (error) {
    console.error("Update cart item selected error:", error);

    res.status(500).json({
      message: "Không thể cập nhật lựa chọn. Vui lòng thử lại",
    });
  }
}

export async function updateCartItemQuantity(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.authUser;

  if (!user) {
    res.status(401).json({
      message: "Vui lòng đăng nhập"
    })
    return
  }
  const rawItemId = req.params.itemId;
  const quantity: unknown = req.body?.quantity;

  if (!rawItemId || typeof rawItemId !== "string" || !/^[1-9]\d{0,18}$/.test(rawItemId)) {
    res.status(400).json({
      message: "sản phẩm không hợp lệ"
    })
    return
  }
  const itemId = BigInt(rawItemId);
  if (itemId > MAX_BIGINT) {
    res.status(400).json({
      message: "ID dòng giỏ hàng vượt giới hạn cho phép",
    });
    return;
  }

  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    quantity > MAX_INT
  ) {
    res.status(400).json({
      message: "Số lượng phải là số nguyên dương hợp lệ",
    });
    return;
  }
  try {
    await prisma.$transaction(
      async (tx) => {
        const cartItem = await tx.cartItem.findUnique({
          where: {
            id: itemId,
            userId: user.id,
          },
          select: {
            model: {
              select: {
                status: true,
                inventory: {
                  select: {
                    stock: true,
                    reservedStock: true,
                  }
                },
                product: {
                  select: {
                    status: true,
                    deletedAt: true,
                    shop: {
                      select: {
                        status: true,
                      },
                    },
                  }
                },
              }
            }
          }
        })

        if (!cartItem) {
          throw new CartError(
            404,
            "CART_ITEM_NOT_FOUND",
            "Không tìm thấy sản phẩm trong giỏ hàng",
          );
        }
        const model = cartItem.model;
        const product = model.product;

        if (
          model.status !== "active" ||
          product.status !== "active" ||
          product.deletedAt !== null ||
          product.shop.status !== "active"
        ) {
          throw new CartError(
            409,
            "MODEL_UNAVAILABLE",
            "Sản phẩm hoặc biến thể hiện không được bán",
          );
        }

        const availableStock = model.inventory
          ? Math.max(
            0,
            model.inventory.stock - model.inventory.reservedStock,
          )
          : 0;

        if (quantity > availableStock) {
          throw new CartError(
            409,
            "INSUFFICIENT_STOCK",
            availableStock === 0
              ? "Biến thể đã hết hàng"
              : `Chỉ còn ${availableStock} sản phẩm có thể mua`,
          );
        }

        // Gán số lượng mới, giữ nguyên selected.
        const result = await tx.cartItem.updateMany({
          where: {
            id: itemId,
            userId: user.id,
          },
          data: {
            quantity,
          },
        });

        if (result.count === 0) {
          throw new CartError(
            404,
            "CART_ITEM_NOT_FOUND",
            "Không tìm thấy sản phẩm trong giỏ hàng",
          );
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    )
    res.status(200).json({
      message: "Đã cập nhật số lượng",
      item: {
        id: itemId.toString(),
        quantity,
      },
    });
  } catch (error) {
    if (error instanceof CartError) {
      res.status(error.status).json({
        code: error.code,
        message: error.message,
      });
      return;
    }

    // Xung đột với thao tác đồng thời: transaction đã bị hủy.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      res.status(409).json({
        code: "CART_BUSY",
        message: "Giỏ hàng đang được cập nhật. Vui lòng thử lại",
      });
      return;
    }

    console.error("Update cart item quantity error:", error);

    res.status(500).json({
      message: "Không thể cập nhật số lượng. Vui lòng thử lại",
    });
  }
}

export async function deleteCartItem(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.authUser

  if (!user) {
    res.status(401).json({
      message: "Vui lòng đăng nhập"
    })
    return
  }

  const rawItemId = req.params.itemId;

  if (typeof rawItemId !== "string" || !/^[1-9]\d{0,18}$/.test(rawItemId)) {
    res.status(400).json({
      message: "ID sản phẩm không hợp lệ"
    })
    return
  }
  const itemId = BigInt(rawItemId)

  if (itemId > MAX_BIGINT) {
    res.status(400).json({
      message: "ID dòng giỏ hàng vượt giới hạn cho phép",
    });
    return;
  }
  try {
    const result = await prisma.cartItem.deleteMany({
      where: {
        id: itemId,
        userId: user.id
      }
    })

    if (result.count === 0) {
      res.status(404).json({
        code: "CART_ITEM_NOT_FOUND",
        message: "Không tìm thấy sản phẩm trong giỏ hàng",
      });
      return;
    }

    res.status(200).json({
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      item: {
        id: itemId.toString(),
      },
    });
  } catch (error) {
    console.error("Delete cart item error:", error);

    res.status(500).json({
      message: "Không thể xóa sản phẩm. Vui lòng thử lại",
    });
  }
}
export async function updateCartSelection(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.authUser;

  if (!user) {
    res.status(401).json({
      message: "Vui lòng đăng nhập",
    });
    return;
  }

  const selected: unknown = req.body?.selected;

  if (typeof selected !== "boolean") {
    res.status(400).json({
      message: "selected phải là true hoặc false",
    });
    return;
  }

  try {
    const result = await prisma.cartItem.updateMany({
      where: {
        userId: user.id,

        // Chỉ cập nhật những dòng cần đổi trạng thái.
        selected: !selected,
      },
      data: {
        selected,
      },
    });

    res.status(200).json({
      message: selected
        ? "Đã chọn tất cả sản phẩm trong giỏ"
        : "Đã bỏ chọn tất cả sản phẩm trong giỏ",
      selected,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Update cart selection error:", error);

    res.status(500).json({
      message: "Không thể cập nhật lựa chọn. Vui lòng thử lại",
    });
  }
}

