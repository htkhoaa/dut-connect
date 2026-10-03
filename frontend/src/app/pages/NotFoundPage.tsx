import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Không tìm thấy trang</h1>
      <p className="text-text-secondary">Trang bạn yêu cầu không tồn tại hoặc chưa khả dụng.</p>
      <Link to="/" className="inline-block font-medium text-primary hover:underline underline-offset-4">Về trang chủ</Link>
    </section>
  );
}
