using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HRMSAPPLICATION.Models
{
    public class AuthFilter : ActionFilterAttribute
    {
        
        
        private TokenHandler tokenHandler;
     public   AuthFilter(TokenHandler tokenHandler)
        {
          
            this.tokenHandler=tokenHandler;
        }
        public override void OnActionExecuted(ActionExecutedContext context)
        {
        
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
           var req=context.HttpContext.Request;
            var controllerActionDescriptor = context.ActionDescriptor as Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor;

            // Check if the controller or action is decorated with [AllowAnonymousJwt]
            if (controllerActionDescriptor != null)
            {
                var hasAllowAnonymous = controllerActionDescriptor.ControllerTypeInfo.GetCustomAttributes(typeof(AllowAnonymousJwtAttribute), true).Any() ||
                                        controllerActionDescriptor.MethodInfo.GetCustomAttributes(typeof(AllowAnonymousJwtAttribute), true).Any();

                if (hasAllowAnonymous)
                {
                
                    return;
                }
            }
            if (req != null)
            {

                var key = req.Headers["X-Special-Header"];

                var principal = tokenHandler.ValidateToken(key);
                if (principal == null) {

                    try
                    {
                        throw new UnauthorizedAccessException();
                    }
                    catch (UnauthorizedAccessException ex)
                    {
                        context.Result = new JsonResult(new { error = "Unauthorized access", message = ex.Message })
                        {
                            StatusCode = StatusCodes.Status401Unauthorized
                        };
                    }
                    }

                
            }
        }
        

    }
}
