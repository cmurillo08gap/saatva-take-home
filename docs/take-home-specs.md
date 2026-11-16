# Take-home specs

Summary of the requirements in `README.md`, split into what is required and what is optional.
## Goal

Build the mattress configurator and cart on top of the existing scaffold (Next.js web, NestJS BFF, mock upstream services). A focused, well-reasoned slice is preferred over a polished everything; unfinished work and shortcuts are acceptable. Expected effort: a few hours.

## Required

### Constraints

Read these first: they frame how every feature below is built.

| # | Constraint | Notes | Main specs it shapes |
| --- | --- | --- | --- |
| C1 | **Web gets its data through the BFF** | The web app does not call upstream services directly. | R1, R2 (and R3–R6 if the cart goes through the BFF) |
| C2 | **Web doesn't know the upstream source** | It must not know which upstream service any piece of data came from. | R1, R2 |
| C3 | **No database** | None is set up and none is needed. We pick how to save the cart, and should be ready to discuss what we'd do differently with a real data store. | **R7**, which then affects R3, R5, R6 |
| C4 | **Don't change `services/upstream`** | Mock third-party services, not under our control. | R1 |

### Shopper features

The **Order** column is the suggested build order.

| Order | # | Spec | Notes | Constraints |
| --- | --- | --- | --- | --- |
| 1 | R1 | **Choose between the mattresses** | Each shows its name, price, image, rating and description. | C1, C2, C4 |
| 2 | R2 | **Configurator UI matches the mock** | Follow `docs/mock.png`. The mock is desktop only; how it adapts to mobile is our decision. | C1, C2 |
| 3 | R3 | **Add a mattress to the cart** | The cart count (header) updates. | C3 (decide the cart storage first) |
| 4 | R4 | **View the cart** | No mock exists; we design it. | C3 |
| 5 | R5 | **Change quantities and remove items** | Within the cart view. | C3 |
| 6 | R6 | **Accurate cart total** | Reflects quantities and the items' prices (prices come from R1). | C3 |
| 7 | R7 | **Cart survives a page refresh** | Cart is still there after reloading. | C3 |

### Implementation pointers (from the README)

- BFF routes go in `apps/api/src/`; `products/` holds a stub to start from.
- Start from the `TODO (candidate)` markers in the code.
- Fonts are already loaded in `app/layout.tsx`; product images are in `apps/web/public/images`.
- Upstream endpoints: `GET :4100/catalog/v1/products` (products and pricing) and `GET :4100/content/v1/products` (marketing copy and reviews).

## Suggested build order

1. **R1** (C1, C2, C4): BFF products route returning one merged shape.
2. **R2**: configurator UI on top of it.
3. **Decide C3**: pick the cart storage before touching the cart.
4. **R3**: add to cart and the header count.
5. **R4, R5, R6**: cart view, quantity changes and removal, total.
6. **R7**: persistence, where the C3 choice pays off (can be built into step 4 if the storage is simple).

Dependencies: R2 needs R1's data; R3 needs R1 and the C3 decision; R6 needs R1's prices; R7 depends on C3. If the cart lives in the BFF, C1 also applies to the cart calls.

## Optional

| # | Spec | Notes |
| --- | --- | --- |
| O1 | **Anything else a real storefront needs** | Only "if you have time left"; scope is our choice. |

## Decisions the README leaves to us

- How the cart is saved (any approach that survives a refresh, no database).
- Mobile layout of the configurator.
- Visual design of the cart.
- What extra storefront features, if any, to add.
