type ActionHandler = (context: ActionContext) => Promise<any>

const testRoute = async (context: ActionContext) => {
  return { message: 'This is a test route' }
}

// Key là chuỗi 'category/actionName', value là hàm handler tương ứng.
export const actions: Record<string, ActionHandler> = {
  'test/route': testRoute
}
