import { StickerPack, GifItem } from '@/types';

export const stickerPacks: StickerPack[] = [
  {
    id: 'cats',
    name: 'Коты',
    emoji: '🐱',
    stickers: [
      { id: 'c1', packId: 'cats', emoji: '😺', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f63a.svg', width: 128, height: 128 },
      { id: 'c2', packId: 'cats', emoji: '😸', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f638.svg', width: 128, height: 128 },
      { id: 'c3', packId: 'cats', emoji: '😹', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f639.svg', width: 128, height: 128 },
      { id: 'c4', packId: 'cats', emoji: '😻', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f63b.svg', width: 128, height: 128 },
      { id: 'c5', packId: 'cats', emoji: '😼', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f63c.svg', width: 128, height: 128 },
      { id: 'c6', packId: 'cats', emoji: '😽', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f63d.svg', width: 128, height: 128 },
      { id: 'c7', packId: 'cats', emoji: '🙀', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f640.svg', width: 128, height: 128 },
      { id: 'c8', packId: 'cats', emoji: '😿', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f63f.svg', width: 128, height: 128 },
      { id: 'c9', packId: 'cats', emoji: '😾', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f63e.svg', width: 128, height: 128 },
    ]
  },
  {
    id: 'hearts',
    name: 'Сердечки',
    emoji: '❤️',
    stickers: [
      { id: 'h1', packId: 'hearts', emoji: '❤️', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2764.svg', width: 128, height: 128 },
      { id: 'h2', packId: 'hearts', emoji: '🧡', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9e1.svg', width: 128, height: 128 },
      { id: 'h3', packId: 'hearts', emoji: '💛', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f49b.svg', width: 128, height: 128 },
      { id: 'h4', packId: 'hearts', emoji: '💚', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f49a.svg', width: 128, height: 128 },
      { id: 'h5', packId: 'hearts', emoji: '💙', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f499.svg', width: 128, height: 128 },
      { id: 'h6', packId: 'hearts', emoji: '💜', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f49c.svg', width: 128, height: 128 },
      { id: 'h7', packId: 'hearts', emoji: '🖤', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f5a4.svg', width: 128, height: 128 },
      { id: 'h8', packId: 'hearts', emoji: '🤍', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f90d.svg', width: 128, height: 128 },
      { id: 'h9', packId: 'hearts', emoji: '💔', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f494.svg', width: 128, height: 128 },
    ]
  },
  {
    id: 'hands',
    name: 'Руки',
    emoji: '👋',
    stickers: [
      { id: 'hd1', packId: 'hands', emoji: '👋', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f44b.svg', width: 128, height: 128 },
      { id: 'hd2', packId: 'hands', emoji: '🤝', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f91d.svg', width: 128, height: 128 },
      { id: 'hd3', packId: 'hands', emoji: '👍', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f44d.svg', width: 128, height: 128 },
      { id: 'hd4', packId: 'hands', emoji: '👎', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f44e.svg', width: 128, height: 128 },
      { id: 'hd5', packId: 'hands', emoji: '✌️', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/270c.svg', width: 128, height: 128 },
      { id: 'hd6', packId: 'hands', emoji: '🤞', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f91e.svg', width: 128, height: 128 },
      { id: 'hd7', packId: 'hands', emoji: '🤟', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f91f.svg', width: 128, height: 128 },
      { id: 'hd8', packId: 'hands', emoji: '🤘', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f918.svg', width: 128, height: 128 },
      { id: 'hd9', packId: 'hands', emoji: '👏', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f44f.svg', width: 128, height: 128 },
    ]
  },
  {
    id: 'faces',
    name: 'Лица',
    emoji: '😀',
    stickers: [
      { id: 'f1', packId: 'faces', emoji: '😀', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f600.svg', width: 128, height: 128 },
      { id: 'f2', packId: 'faces', emoji: '😂', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f602.svg', width: 128, height: 128 },
      { id: 'f3', packId: 'faces', emoji: '🤣', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f923.svg', width: 128, height: 128 },
      { id: 'f4', packId: 'faces', emoji: '😍', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f60d.svg', width: 128, height: 128 },
      { id: 'f5', packId: 'faces', emoji: '🥰', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f970.svg', width: 128, height: 128 },
      { id: 'f6', packId: 'faces', emoji: '😎', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f60e.svg', width: 128, height: 128 },
      { id: 'f7', packId: 'faces', emoji: '🤔', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f914.svg', width: 128, height: 128 },
      { id: 'f8', packId: 'faces', emoji: '😴', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f634.svg', width: 128, height: 128 },
      { id: 'f9', packId: 'faces', emoji: '🤡', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f921.svg', width: 128, height: 128 },
    ]
  },
  {
    id: 'animals',
    name: 'Животные',
    emoji: '🐶',
    stickers: [
      { id: 'a1', packId: 'animals', emoji: '🐶', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f436.svg', width: 128, height: 128 },
      { id: 'a2', packId: 'animals', emoji: '🐱', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f431.svg', width: 128, height: 128 },
      { id: 'a3', packId: 'animals', emoji: '🐻', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg', width: 128, height: 128 },
      { id: 'a4', packId: 'animals', emoji: '🐼', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43c.svg', width: 128, height: 128 },
      { id: 'a5', packId: 'animals', emoji: '🦊', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f98a.svg', width: 128, height: 128 },
      { id: 'a6', packId: 'animals', emoji: '🦁', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f981.svg', width: 128, height: 128 },
      { id: 'a7', packId: 'animals', emoji: '🐸', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f438.svg', width: 128, height: 128 },
      { id: 'a8', packId: 'animals', emoji: '🦄', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f984.svg', width: 128, height: 128 },
      { id: 'a9', packId: 'animals', emoji: '🐧', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f427.svg', width: 128, height: 128 },
    ]
  }
];

export const gifCollection: GifItem[] = [
  { id: 'g1', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtZ2JiZDR0a3B6eHJlb3N0MjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif', previewUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/200w.gif', width: 480, height: 270 },
  { id: 'g2', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGtxdHRiNTJqMGR1cWVtMjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlBO7eyXzSZkJri/giphy.gif', previewUrl: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/200w.gif', width: 480, height: 270 },
  { id: 'g3', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjN5b2F4cWJ3eHJlb3N0MjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oriO0OEd9QIDdllqo/giphy.gif', previewUrl: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/200w.gif', width: 480, height: 270 },
  { id: 'g4', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjN5b2F4cWJ3eHJlb3N0MjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9IgG50Fb7Mi0prBC/giphy.gif', previewUrl: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/200w.gif', width: 480, height: 270 },
  { id: 'g5', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjN5b2F4cWJ3eHJlb3N0MjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26ufdipQqU2lhNA4g/giphy.gif', previewUrl: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w.gif', width: 480, height: 270 },
  { id: 'g6', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjN5b2F4cWJ3eHJlb3N0MjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0MYt5jPR6QX5pnqM/giphy.gif', previewUrl: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200w.gif', width: 480, height: 270 },
  { id: 'g7', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjN5b2F4cWJ3eHJlb3N0MjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6Zt481isNVuQI1l6/giphy.gif', previewUrl: 'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/200w.gif', width: 480, height: 270 },
  { id: 'g8', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjN5b2F4cWJ3eHJlb3N0MjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7abKhOpu0NwenH3O/giphy.gif', previewUrl: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200w.gif', width: 480, height: 270 },
  { id: 'g9', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjN5b2F4cWJ3eHJlb3N0MjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlvtIPaPdt2usKs/giphy.gif', previewUrl: 'https://media.giphy.com/media/l0HlvtIPaPdt2usKs/200w.gif', width: 480, height: 270 },
  { id: 'g10', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjN5b2F4cWJ3eHJlb3N0MjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEjHAUOqG3lSS0f1C/giphy.gif', previewUrl: 'https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/200w.gif', width: 480, height: 270 },
  { id: 'g11', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjN5b2F4cWJ3eHJlb3N0MjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0MYGb1LuZ3n7dRnO/giphy.gif', previewUrl: 'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/200w.gif', width: 480, height: 270 },
  { id: 'g12', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjN5b2F4cWJ3eHJlb3N0MjN5b2F4cWJ3eHJlb3N0MjN5b2F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif', previewUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/200w.gif', width: 480, height: 270 },
];
